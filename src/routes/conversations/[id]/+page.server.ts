import { env } from '$env/dynamic/private';
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { validate, ValidationError } from '$lib/validation';
import { schema } from '$lib/validation/prompt';

class EmbedError extends Error {}

export async function load({ fetch, depends, params }) {
	depends('api:conversations');
	depends('api:prompts');

	const url = new URL(`${env.API_ENDPOINT}/conversations`);
	const sources = `sources(similarity,...pages(index,...inodes(id,name,from_page)))`;
	url.searchParams.set('select', `error,prompts(query,response,error,${sources}),inodes(path)`);
	url.searchParams.set('prompts.order', 'created_at.asc');
	url.searchParams.set('prompts.sources.order', 'similarity.asc');
	url.searchParams.set('id', `eq.${params.id}`);

	const response = await fetch(url);
	if (response.status !== 200) {
		throw new Error(await response.text());
	}
	const conversations = await response.json();
	const conversation = conversations[0];

	const paths =
		'inodes' in conversation
			? conversation.inodes.map((inode: { path: string }) => inode.path)
			: [];

	return { paths, ...conversation };
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
	url.searchParams.set('select', 'id');

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

	const response = await fetch(url, {
		method: 'POST',
		body: JSON.stringify({ prompt_id, similarity_top_k }),
		headers: {
			'Content-Type': 'application/json'
		}
	});
	if (response.status != 200) {
		throw new Error(await response.text());
	}

	return response.json();
}

export const actions = {
	create_prompt: async ({ request, fetch, params }) => {
		const conversation_id = parseInt(params.id);
		try {
			const data = await validate(request, schema);

			const prompt = await create_prompt(fetch, conversation_id, data.query);
			// Don't substantiate errored prompts (that have no embedding)
			if (prompt.error) {
				return;
			}

			await substantiate_prompt(fetch, prompt.id, data.similarity_top_k);

			return { success: true };
		} catch (err) {
			if (err instanceof ValidationError) {
				return fail(400, err.format());
			} else {
				throw err;
			}
		}
	}
} satisfies Actions;
