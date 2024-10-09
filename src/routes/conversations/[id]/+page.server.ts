import type { ServerLoadEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { validate, ValidationError } from '$lib/validation';
import { schema } from '$lib/validation/prompt';

async function get_folder_options(event: ServerLoadEvent, folders: string[]) {
	const { fetch } = event;

	const must: Record<string, any>[] = [
		{
			bool: {
				should: folders.map((folder) => ({ term: { folder: folder } }))
			}
		}
	];

	const res = await fetch(`${env.OPENSEARCH_ENDPOINT}/inodes/_search`, {
		method: 'post',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			_source: { excludes: ['pages'] },
			aggs: { folder: { terms: { field: 'folder' } } },
			query: { term: { type: 'file' } },
			post_filter: { bool: { must } }
		})
	});

	const body = await res.json();
	if (res.status !== 200) {
		throw new Error(`Invalid response from opensearch. ${body.error.type}: ${body.error.reason}`);
	}

	return {
		total: body.hits.total.value,
		options: body.aggregations.folder.buckets.map((bucket: Record<string, any>) => ({
			label: bucket.key,
			...bucket
		}))
	};
}

export async function load(event) {
	const { fetch, depends, params } = event;
	depends('api:conversations');
	depends('api:prompts');

	const url = new URL(`${env.API_ENDPOINT}/conversations`);
	const sources = `sources(similarity,...pages(index,...inodes(id,name,...files(from_page))))`;
	url.searchParams.set('select', `error,prompts(query,response,error,${sources}),inodes(path)`);
	url.searchParams.set('prompts.order', 'created_at.asc');
	url.searchParams.set('prompts.sources.order', 'similarity.asc');
	url.searchParams.set('id', `eq.${params.id}`);

	const res = await fetch(url);
	if (res.status !== 200) {
		throw new Error(await res.text());
	}
	const conversations = await res.json();
	const conversation = conversations[0];

	const paths =
		'inodes' in conversation
			? conversation.inodes.map((inode: { path: string }) => inode.path)
			: [];

	const { options, total } = await get_folder_options(event, paths);

	return { paths, ...conversation, options, total };
}

class EmbedError extends Error {}

async function embed(input: string) {
	const response = await fetch('https://api.openai.com/v1/embeddings', {
		method: 'post',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${env.OPENAI_API_KEY}`
		},
		body: JSON.stringify({ input, model: 'text-embedding-3-small' })
	});

	if (response.status !== 200) {
		const data = await response.json();
		if (
			data.error.type == 'invalid_request_error' &&
			data.error.message.includes('maximum context length')
		) {
			throw new EmbedError('embed_context_exceeded');
		}

		throw new Error(data.error.message);
	}

	return (await response.json()).data[0].embedding;
}

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
			if ('response' in prompt && prompt.response != '') {
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
			messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages]
		})
	});

	const data = await response.json();

	if (response.status !== 200) {
		if (
			data.error.type == 'invalid_request_error' &&
			data.error.code == 'context_length_exceeded'
		) {
			throw new CompletionError('completion_context_exceeded');
		}

		throw new Error(data.error.message);
	}

	return data.choices[0].message.content;
}

type CreatePromptData = {
	conversation_id: number;
	query: string;
	embedding: Array<number>;
	error: string;
};

async function create_prompt(fetch: Function, conversation_id: number, query: string) {
	const data: Partial<CreatePromptData> = {
		conversation_id,
		query
	};

	const url = new URL(`${env.API_ENDPOINT}/prompts`);

	// Only fetch related info when embed succesfull
	try {
		data.embedding = await embed(query);

		// Fetch conversation history so we can send the whole conversation to LLM
		url.searchParams.set(
			'select',
			'id,query,error,...conversations(prompts(query,response,sources(...pages(contents))))'
		);
		url.searchParams.set('conversations.prompts.response', 'not.is.null');
		url.searchParams.set('conversations.prompts.order', 'created_at.asc');
		url.searchParams.set('conversations.prompts.sources.order', 'similarity.asc');
	} catch (err) {
		if (err instanceof EmbedError) {
			data.error = err.message;
		} else {
			throw err;
		}
	}

	const response = await fetch(url, {
		method: 'POST',
		body: JSON.stringify(data),
		headers: {
			'Content-Type': 'application/json',
			Prefer: 'return=representation'
		}
	});
	if (response.status != 201) {
		throw new Error(await response.text());
	}

	const prompts = await response.json();
	return prompts[0];
}

/*
 * Substantiate prompt adds source pages to the prompts based on the filtered
 * context of the conversation the prompt is a part of
 */
async function substantiate_prompt(
	fetch: Function,
	prompt_id: number,
	similarity_top_k: number = 3
) {
	const url = new URL(`${env.API_ENDPOINT}/rpc/substantiate_prompt`);
	url.searchParams.set('select', 'page_id,similarity,...pages(contents)');

	const response = await fetch(url, {
		method: 'POST',
		body: JSON.stringify({ prompt_id, similarity_top_k }),
		headers: {
			'Content-Type': 'application/json',
			Prefer: 'return=representation'
		}
	});
	if (response.status != 200) {
		throw new Error(await response.text());
	}

	return response.json();
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
	console.log(response.status);
	if (response.status != 204) {
		throw new Error(await response.text());
	}
}

export const actions = {
	answer_prompt: async ({ request, fetch, params }) => {
		const conversation_id = parseInt(params.id);
		try {
			const data = await validate(request, schema);

			// We expect users to insert queries that are to long, don't substantiate errored prompts (that have no embedding)
			const prompt = await create_prompt(fetch, conversation_id, data.query);
			if (prompt.error) {
				return;
			}

			const sources = await substantiate_prompt(fetch, prompt.id, data.similarity_top_k);

			// TODO - When creating sources in postgres trigger, we can do this in one call
			const prompts = prompt.prompts;
			prompt.sources = sources;
			prompts.push(prompt);

			// We expect users to insert to much context into conversation.
			const answer = await generate_answer(prompts);

			await set_prompt_answer(fetch, prompt.id, answer);
		} catch (err) {
			if (err instanceof ValidationError) {
				return fail(400, err.format());
			} else if (err instanceof CompletionError) {
				await set_conversation_error(fetch, conversation_id, err.message);
			} else {
				throw err;
			}
		}
	}
} satisfies Actions;
