import { env } from '$env/dynamic/private';
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { validate, ValidationError } from '$lib/validation';
import { schema as prompt_schema } from '$lib/validation/prompt';
import { schema as conversation_schema } from '$lib/validation/conversation';
import { update_filters } from '$lib/conversation.ts';

class EmbedError extends Error {}

async function get_conversation(fetch: typeof global.fetch, id: string) {
	const url = new URL(`${env.API_ENDPOINT}/conversations`);
	const sources = `sources(similarity,...pages(index,...inodes(id,name,from_page)))`;
	url.searchParams.set('select', `error,prompts(query,response,error,${sources}),inodes(path)`);
	url.searchParams.set('prompts.order', 'created_at.asc');
	url.searchParams.set('prompts.sources.order', 'similarity.desc');
	url.searchParams.set('id', `eq.${id}`);

	const response = await fetch(url, {
		headers: {
			Accept: 'application/vnd.pgrst.object+json'
		}
	});
	if (response.status !== 200) {
		throw new Error(await response.text());
	}
	return response.json();
}

export async function load({ fetch, depends, params }) {
	depends('api:conversations');
	depends('api:prompts');

	const conversation = await get_conversation(fetch, params.id);

	const folders =
		'inodes' in conversation
			? conversation.inodes.map((inode: { path: string }) => inode.path)
			: [];

	return { folders, ...conversation };
}

/**
 * Create a query embedding
 */
async function embed(input: string) {
	const response = await fetch('https://api.openai.com/v1/embeddings', {
		method: 'POST',
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

/**
 * Concatenate all queries from previous prompts with the current query.
 * We do this to search for pages that are related to all of the conversation
 */
async function create_embed_query(fetch: Function, conversation_id: number, query: string) {
	const url = new URL(`${env.API_ENDPOINT}/prompts`);
	url.searchParams.set('conversation_id', `eq.${conversation_id}`);
	url.searchParams.set('select', 'query');
	url.searchParams.set('order', 'created_at.asc');

	const response = await fetch(url);

	if (response.status != 200) {
		throw new Error(await response.text());
	}

	const prompts = [...(await response.json()), { query }];

	return prompts.map((prompt) => prompt.query).join(', ');
}

/**
 * Create a new prompt in conversation
 */
async function create_prompt(
	fetch: Function,
	conversation_id: number,
	query: string,
	embedding: Array<number> | undefined = undefined,
	error: string | undefined = undefined
) {
	const url = new URL(`${env.API_ENDPOINT}/prompts`);
	url.searchParams.set('select', 'id,error');

	const response = await fetch(url, {
		method: 'POST',
		body: JSON.stringify({ conversation_id, query, embedding, error }),
		headers: {
			'Content-Type': 'application/json',
			Prefer: 'return=representation',
			Accept: 'application/vnd.pgrst.object+json'
		}
	});
	if (response.status != 201) {
		throw new Error(await response.text());
	}

	return response.json();
}

async function get_nearest_chunks(
	fetch: Function,
	embedding: Array<number>,
	folders: string[] | undefined = []
) {
	// Define the parent folders we're interested in
	const must: Record<string, any>[] = [
		{ term: { join_field: 'page' } },
		{
			has_parent: {
				parent_type: 'inode',
				query: {
					bool: {
						should: folders.map((folder) => ({ term: { folder: folder } }))
					}
				}
			}
		},
		{
			knn: {
				embedding: {
					vector: embedding,
					min_score: 0.5
				}
			}
		}
	];

	const response = await fetch(`${env.OPENSEARCH_ENDPOINT}/inodes/_search`, {
		method: 'post',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			// Don't return all page contents
			_source: { excludes: ['embedding', 'contents'] },
			query: { bool: { must } }
		})
	});

	const body = await response.json();
	if (response.status !== 200) {
		console.error(body.error);
		throw new Error(`Invalid response from opensearch. ${body.error.type}: ${body.error.reason}`);
	}

	return body.hits.hits;
}

async function attach_chunks_to_prompt(fetch: Function, prompt_id: number, page_ids: number[]) {
	const sources_data = page_ids.map((page_id) => {
		return {
			page_id,
			prompt_id
		};
	});

	const url = new URL(`${env.API_ENDPOINT}/sources`);

	const response = await fetch(url, {
		method: 'POST',
		body: JSON.stringify(sources_data),
		headers: {
			'Content-Type': 'application/json'
		}
	});

	if (response.status != 204) {
		throw new Error(await response.text());
	}

	return response.json();
}

export const actions = {
	create_prompt: async ({ request, fetch, params }) => {
		const conversation_id = parseInt(params.id);
		try {
			const data = await validate(request, prompt_schema);

			try {
				const embed_query = await create_embed_query(fetch, conversation_id, data.query);
				const embedding = await embed(embed_query);

				const prompt = await create_prompt(fetch, conversation_id, data.query, embedding);

				// Get nearest neighbours from opensearch
				const pages = await get_nearest_chunks(fetch, embedding, data.folders);
				const page_ids = pages.map((page: Record<string, any>) => page._source.id);
				// TODO - Get similarity scores from Opensearch
				await attach_chunks_to_prompt(fetch, prompt.id, page_ids);

				return { success: true };
			} catch (err) {
				if (err instanceof EmbedError) {
					await create_prompt(fetch, conversation_id, data.query, undefined, err.message);
					return { success: true };
				} else {
					throw err;
				}
			}
		} catch (err) {
			if (err instanceof ValidationError) {
				return fail(400, err.format());
			} else {
				throw err;
			}
		}
	},

	update_filters: async ({ request, fetch, params }) => {
		const conversation_id = parseInt(params.id);

		try {
			const data = await validate(request, conversation_schema);
			const { folders } = data;

			await update_filters(fetch, conversation_id, folders);
		} catch (err) {
			if (err instanceof ValidationError) {
				return fail(400, err.format());
			} else {
				throw err;
			}
		}
	}
} satisfies Actions;
