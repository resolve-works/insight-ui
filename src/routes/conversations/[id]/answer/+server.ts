import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { PassThrough, Readable } from 'stream';
import { TransformStream } from 'stream/web';

class CompletionError extends Error {}

async function generate_answer(
	prompts: { query: string; response: string; sources: { contents: string }[] }[]
) {
	// The system prompt instructs the model on how to approach the users messages
	const SYSTEM_PROMPT = `You are a helpful AI assistant, optimized for
finding information in document collections. You will be provided with
some context in the form of several pages from a document collection. 

Every user message will optionally provide you with some context information,
and a query. You answer the query based only on the context provided to you in
the users messages, without using any prior knowledge.`;

	// Build user & assistant messages from the complete conversation
	const messages = prompts
		.map((prompt) => {
			// Create single string from sources
			// TODO - Add more info to sources to allow model to provide more
			// structured responses pointing to certain sources
			const context = prompt.sources
				.map((source: Record<string, any>) => source.contents)
				.join('\n\n');

			const messages = [
				{
					role: 'user',
					content: `Context:
"""
${context}
"""

Query:
"""
${prompt.query}
"""`
				}
			];

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
		method: 'post',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${env.OPENAI_API_KEY}`
		},
		body: JSON.stringify({
			model: 'gpt-4-turbo',
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

async function set_conversation_error(fetch: Function, conversation_id: number, error: string) {
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
	url.searchParams.set('select', 'prompts(query,response,error,sources(...pages(contents)))');
	url.searchParams.set('prompts.order', 'created_at.asc');
	url.searchParams.set('prompts.sources.order', 'similarity.asc');
	url.searchParams.set('id', `eq.${conversation_id}`);

	const response = await fetch(url);
	const conversations = await response.json();
	return conversations[0].prompts;
}

const transformer = {
	decoder: new TextDecoder(),
	encoder: new TextEncoder(),

	transform: function (chunk, controller) {
		const text = this.decoder.decode(chunk);
		const lines = text.split('\n\n');
		const parsedLines = lines
			.map((line) => line.replace(/^data: /, '').trim()) // Remove the "data: " prefix
			.filter((line) => line !== '' && line !== '[DONE]') // Remove empty lines and "[DONE]"
			.map((line) => JSON.parse(line)); // Parse the JSON string

		for (const parsedLine of parsedLines) {
			const { choices } = parsedLine;
			const { delta } = choices[0];
			const { content } = delta;
			// Update the UI with the new content
			if (content) {
				controller.enqueue(this.encoder.encode(content));
			}
		}
	}
};

class Consumer {
	stream: ReadableStream<Uint8Array>;
	answer = '';
	decoder = new TextDecoder();

	constructor(stream: ReadableStream<Uint8Array>) {
		this.stream = stream;
	}

	async consume() {
		for await (const chunk of this.stream) {
			const text = this.decoder.decode(chunk);
			this.answer += text;
		}

		console.log(this.answer);
	}
}

export async function POST({ fetch, params }) {
	const prompts = await get_prompts(fetch, params.id);

	// TODO - Catch CompletionError
	const response = await generate_answer(prompts);

	if (!response.body) {
		return error(500);
	}

	// Save response & stream response to the browser. For this we'll turn the openai stream into just the text, and duplicate the stream to these 2 destinations
	const [to_consume, to_respond] = response.body
		.pipeThrough(new TransformStream(transformer))
		.tee();

	const consumer = new Consumer(to_consume);
	consumer.consume();

	return new Response(to_respond, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'X-Accel-Buffering': 'no'
		}
	});
}
