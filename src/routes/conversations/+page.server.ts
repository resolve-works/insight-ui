import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { env } from '$env/dynamic/private';
import { parse_content_range, PAGE_SIZE } from '$lib/pagination';
import { validate, ValidationError } from '$lib/validation';
import { schema } from '$lib/validation/conversation';
import type { RequestEvent } from '@sveltejs/kit';
import { update_filters } from '$lib/conversation';

export async function load({ depends, fetch, url }) {
	depends('api:conversations');

	const param = url.searchParams.get('page');
	const page = param ? parseInt(param) : 1;

	const api_url = new URL(`${env.API_ENDPOINT}/conversations`);
	api_url.searchParams.set('select', `id,created_at,error,prompts(query),inodes(path)`);
	api_url.searchParams.set('order', 'created_at.desc');
	api_url.searchParams.set('prompts.order', 'created_at.asc');
	api_url.searchParams.set('limit', PAGE_SIZE.toString());
	api_url.searchParams.set('offset', ((page - 1) * PAGE_SIZE).toString());

	const res = await fetch(api_url, { headers: { prefer: 'count=exact' } });
	const conversations = await res.json();

	// Get total items from response
	const pagination = parse_content_range(res.headers.get('content-range'));

	return {
		conversations,
		page,
		...pagination
	};
}

async function create_conversation({ request, fetch }: RequestEvent) {
	try {
		const data = await validate(request, schema);
		const { folders } = data;

		// Conversation create url
		const url = new URL(`${env.API_ENDPOINT}/conversations`);
		url.searchParams.set('select', 'id');

		// Create conversation
		const res = await fetch(url, {
			method: 'POST',
			body: JSON.stringify({}),
			headers: {
				'Content-Type': 'application/json',
				Prefer: 'return=representation',
				Accept: 'application/vnd.pgrst.object+json'
			}
		});

		if (res.status !== 201) {
			throw new Error(await res.text());
		}

		const conversation = await res.json();
		await update_filters(fetch, conversation.id, folders);

		return redirect(303, `/conversations/${conversation.id}`);
	} catch (err) {
		if (err instanceof ValidationError) {
			return fail(400, err.format());
		}
		throw err;
	}
}

export const actions = {
	create_conversation
} satisfies Actions;
