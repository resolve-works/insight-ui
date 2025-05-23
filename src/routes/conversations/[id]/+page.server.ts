import { env } from '$env/dynamic/private';
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { validate, ValidationError } from '$lib/validation';
import { schema as prompt_schema } from '$lib/validation/prompt';
import { schema as conversation_schema } from '$lib/validation/conversation';
import { update_filters } from '$lib/conversation.ts';
import { API_ENDPOINT } from '$env/static/private';

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

async function get_previous_prompts(fetch: Function, conversation_id: number) {
	const url = new URL(`${env.API_ENDPOINT}/prompts`);
	url.searchParams.set('conversation_id', `eq.${conversation_id}`);
	url.searchParams.set('select', 'query,sources(page_id)');
	url.searchParams.set('order', 'created_at.asc');

	const response = await fetch(url);

	if (response.status != 200) {
		throw new Error(await response.text());
	}

	return response.json();
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

/**
 * Get chunks (pages in this case) that are semantically related to our question.
 */
async function get_nearest_chunks(
	fetch: Function,
	embedding: Array<number>,
	folders: string[] | undefined = [],
	previously_found_chunks: number[] = []
) {
	const response = await fetch(`${env.OPENSEARCH_ENDPOINT}/inodes/_search`, {
		method: 'post',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			// Don't return all page contents
			_source: { excludes: ['embedding', 'contents'] },
			query: {
				knn: {
					embedding: {
						vector: embedding,
						k: 10,
						filter: {
							bool: {
								must: [
									{ term: { join_field: 'page' } },
									// Filter by parent folders we're interested in
									{
										has_parent: {
											parent_type: 'inode',
											query: {
												bool: {
													should: folders.map((folder) => ({ term: { folder: folder } }))
												}
											}
										}
									}
								],
								must_not: [
									// Filter out previously found chunks
									{
										terms: {
											id: previously_found_chunks
										}
									}
								]
							}
						}
					}
				}
			}
		})
	});

	const body = await response.json();
	if (response.status !== 200) {
		throw new Error(`Invalid response from opensearch. ${body.error.type}: ${body.error.reason}`);
	}

	return body.hits.hits;
}

async function attach_chunks_to_prompt(
	fetch: Function,
	prompt_id: number,
	pages: { page_id: number; similarity: number }[]
) {
	const sources_data = pages.map((page) => {
		return {
			...page,
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

	if (response.status != 201) {
		throw new Error(await response.text());
	}
}

export const actions = {
	create_prompt: async ({ request, fetch, params }) => {
		const conversation_id = parseInt(params.id);
		try {
			const data = await validate(request, prompt_schema);

			try {
				const previous_prompts = await get_previous_prompts(fetch, conversation_id);

				// Concatenate all queries from previous prompts with the current query.
				// We do this to search for pages that are related to all of the conversation
				const embed_query = [...previous_prompts.map((p) => p.query), data.query].join(', ');
				const embedding = await embed(embed_query);

				const prompt = await create_prompt(fetch, conversation_id, data.query, embedding);

				// Get nearest neighbours from opensearch
				const previously_found_chunks = previous_prompts
					.map((p: { sources: { page_id: number }[] }) => p.sources.map((s) => s.page_id))
					.reduce((a: number[], b: number[]) => [...a, ...b], []);
				const search_results = await get_nearest_chunks(
					fetch,
					embedding,
					data.folders,
					previously_found_chunks
				);
				const pages = search_results.map((page: Record<string, any>) => ({
					page_id: page._source.id,
					similarity: page._score
				}));
				await attach_chunks_to_prompt(fetch, prompt.id, pages);

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
