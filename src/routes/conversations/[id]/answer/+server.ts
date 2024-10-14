import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { TransformStream } from 'stream/web';
import SYSTEM_PROMPT from '$lib/prompts/system.txt?raw';
import USER_PROMPT from '$lib/prompts/user.txt?raw';

class CompletionError extends Error {}

async function generate_answer(
	prompts: { query: string; response: string; sources: { contents: string }[] }[]
) {
	// Build user & assistant messages from the complete conversation
	const messages = prompts
		.map((prompt) => {
			// Create single string from sources
			// TODO - Add more info to sources to allow model to provide more
			// structured responses pointing to certain sources
			const context = prompt.sources
				.map((source: Record<string, any>) => source.contents)
				.join('\n\n');

			const content = USER_PROMPT.replace('{context}', context).replace('{query}', prompt.query);

			const messages = [{ role: 'user', content }];

			// Add assistant answer when prompt was answered
			if ('response' in prompt && prompt.response) {
				messages.push({
					role: 'assistant',
					content: prompt.response
				});
			}

			return messages;
		})
		.flat();

	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${env.OPENAI_API_KEY}`
		},
		body: JSON.stringify({
			model: 'gpt-4o',
			messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
			stream: true
		})
	});

	if (response.status !== 200) {
		const data = await response.json();
		if (
			data.error.type == 'invalid_request_error' &&
			data.error.code == 'context_length_exceeded'
		) {
			throw new CompletionError('completion_context_exceeded');
		}

		throw new Error(data.error.message);
	}

	return response;
}

async function set_prompt_answer(fetch: Function, prompt_id: number, answer: string) {
	const url = new URL(`${env.API_ENDPOINT}/prompts`);
	url.searchParams.set('id', `eq.${prompt_id}`);

	const response = await fetch(url, {
		method: 'PATCH',
		body: JSON.stringify({ response: answer }),
		headers: {
			'Content-Type': 'application/json'
		}
	});
	if (response.status != 204) {
		throw new Error(await response.text());
	}
}

async function set_conversation_error(fetch: Function, conversation_id: string, error: string) {
	const url = new URL(`${env.API_ENDPOINT}/conversations`);
	url.searchParams.set('id', `eq.${conversation_id}`);

	const response = await fetch(url, {
		method: 'PATCH',
		body: JSON.stringify({ error }),
		headers: {
			'Content-Type': 'application/json'
		}
	});
	if (response.status != 204) {
		throw new Error(await response.text());
	}
}

async function get_prompts(fetch: Function, conversation_id: string) {
	const url = new URL(`${env.API_ENDPOINT}/conversations`);

	// Fetch conversation history so we can send the whole conversation to LLM
	url.searchParams.set('select', 'prompts(id,query,response,error,sources(...pages(contents)))');
	url.searchParams.set('prompts.order', 'created_at.asc');
	url.searchParams.set('prompts.sources.order', 'similarity.asc');
	url.searchParams.set('id', `eq.${conversation_id}`);

	const response = await fetch(url);
	const conversations = await response.json();
	return conversations[0].prompts;
}

export async function POST({ fetch, params }) {
	const prompts = await get_prompts(fetch, params.id);

	try {
		const response = await generate_answer(prompts);

		if (!response.body) {
			return error(500);
		}

		// Transform OpenAI completion stream to text only
		const transformer = {
			buffer: '',
			decoder: new TextDecoder(),
			encoder: new TextEncoder(),

			transform: function (chunk, controller) {
				const text = this.decoder.decode(chunk);
				// Parse SSE response
				const lines = text
					.split('\n\n')
					.map((line) => line.replace(/^data: /, '').trim())
					.filter((line) => line !== '' && line !== '[DONE]');

				// When buffer is set, there is a partial response from the last chunk
				if (this.buffer) {
					lines[0] = this.buffer + lines[0];
					this.buffer = '';
				}

				for (const line of lines) {
					try {
						// Only get the textual delta
						const data = JSON.parse(line);
						const content = data.choices[0].delta.content;
						if (content) {
							controller.enqueue(this.encoder.encode(content));
						}
					} catch (err) {
						// Responses can be cut of, the rest of the JSON response will follow in next chunk
						if (err instanceof SyntaxError) {
							this.buffer = line;
						}
					}
				}
			}
		};

		// Save response & stream response to the browser. For this we'll turn the openai stream into just the text, and duplicate the stream to these 2 destinations
		const reader = response.body.pipeThrough(new TransformStream(transformer)).getReader();

		const decoder = new TextDecoder();
		let answer = '';

		// Proxy response body so we can also save the answer
		const response_body = new ReadableStream({
			start(controller) {
				return pump();
				async function pump() {
					const { done, value } = await reader.read();

					// Store answer before closing so we can invalidate
					if (done) {
						await set_prompt_answer(fetch, prompts.at(-1).id, answer);

						controller.close();
						return;
					}

					answer += decoder.decode(value);

					controller.enqueue(value);
					return pump();
				}
			}
		});

		// Return a event stream so we can render the text as it comes in
		return new Response(response_body, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				'X-Accel-Buffering': 'no'
			}
		});
	} catch (err) {
		if (err instanceof CompletionError) {
			await set_conversation_error(fetch, params.id, err.message);
			return error(400, err.message);
		}

		throw err;
	}
}
