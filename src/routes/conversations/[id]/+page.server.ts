import { env } from '$env/dynamic/private';
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { validate, ValidationError } from '$lib/validation';
import { schema as prompt_schema } from '$lib/validation/prompt';
import { schema as conversation_schema } from '$lib/validation/conversation';

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

	const selected_folders =
		'inodes' in conversation
			? conversation.inodes.map((inode: { path: string }) => inode.path)
			: [];

	return { selected_folders, ...conversation };
}

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

	try {
		// Concatenate all queries from previous prompts with the current query.
		// We do this to search for pages that are related to all of the conversation
		const embed_query = await create_embed_query(fetch, conversation_id, query);
		data.embedding = await embed(embed_query);
	} catch (err) {
		if (err instanceof EmbedError) {
			data.error = err.message;
		} else {
			throw err;
		}
	}

	const url = new URL(`${env.API_ENDPOINT}/prompts`);
	url.searchParams.set('select', 'id,error');

	const response = await fetch(url, {
		method: 'POST',
		body: JSON.stringify(data),
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

/*
 * Substantiate prompt adds source pages to the prompts based on the filtered
 * context of the conversation the prompt is a part of
 */
async function substantiate_prompt(fetch: Function, prompt_id: number, amount: number = 3) {
	const url = new URL(`${env.API_ENDPOINT}/rpc/substantiate_prompt`);

	const response = await fetch(url, {
		method: 'POST',
		body: JSON.stringify({ prompt_id, amount }),
		headers: {
			'Content-Type': 'application/json'
		}
	});
	if (response.status != 200) {
		throw new Error(await response.text());
	}

	return response.json();
}

async function set_conversation_filters(
	fetch: Function,
	prompt_id: number,
	query: string | undefined = undefined,
	folders: string[] = []
) {
	const url = new URL(`${env.API_ENDPOINT}/rpc/set_conversation_filters`);

	const response = await fetch(url, {
		method: 'POST',
		body: JSON.stringify({ prompt_id, query, folders }),
		headers: {
			'Content-Type': 'application/json'
		}
	});
	if (response.status != 200) {
		throw new Error(await response.text());
	}

	return response.json();
}

async function get_inodes(fetch: typeof global.fetch, paths: string[]) {
	const url = new URL(`${env.API_ENDPOINT}/inodes`);
	url.searchParams.set('path', `in.(${paths.map((path: string) => `"${path}"`).join(',')})`);
	url.searchParams.set('select', 'id');
	const response = await fetch(url);
	if (response.status != 200) {
		throw new Error(await response.text());
	}
	return response.json();
}

async function upsert_conversations_inodes(
	fetch: typeof global.fetch,
	conversation_id: number,
	inodes: { id: number }[]
) {
	// Upsert chosen folders
	const url = new URL(`${env.API_ENDPOINT}/conversations_inodes`);
	const response = await fetch(url, {
		method: 'POST',
		body: JSON.stringify(inodes.map(({ id }) => ({ inode_id: id, conversation_id }))),
		headers: {
			'Content-Type': 'application/json',
			Prefer: 'resolution=merge-duplicates'
		}
	});

	if (response.status != 200) {
		throw new Error(await response.text());
	}
}

async function delete_conversations_inodes(
	fetch: typeof global.fetch,
	conversation_id: number,
	inodes: { id: number }[]
) {
	// Remove folders that are not chosen
	const url = new URL(`${env.API_ENDPOINT}/conversations_inodes`);
	url.searchParams.set('conversation_id', `eq.${conversation_id}`);
	url.searchParams.set('inode_id', `in.(${inodes.map(({ id }) => `"${id}"`).join(',')})`);
	const response = await fetch(url, {
		method: 'DELETE'
	});

	if (response.status != 200) {
		throw new Error(await response.text());
	}
}

export const actions = {
	create_prompt: async ({ request, fetch, params }) => {
		const conversation_id = parseInt(params.id);
		try {
			const data = await validate(request, prompt_schema);

			const prompt = await create_prompt(fetch, conversation_id, data.query);
			// Don't substantiate errored prompts (that have no embedding)
			if (prompt.error) {
				return;
			}

			// TODO - Get nearest neighbours from opensearch

			// TODO - Attach nearest neighbours to prompt

			return { success: true };
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

			const url = new URL(`${env.API_ENDPOINT}/rpc/set_conversation_filters`);

			const response = await fetch(url, {
				method: 'POST',
				body: JSON.stringify({ conversation_id, folders }),
				headers: {
					'Content-Type': 'application/json'
				}
			});
			if (response.status != 204) {
				throw new Error(await response.text());
			}
		} catch (err) {
			if (err instanceof ValidationError) {
				return fail(400, err.format());
			} else {
				throw err;
			}
		}
	}
} satisfies Actions;
