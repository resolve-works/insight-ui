import type { Actions } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { schema } from '$lib/validation/inode';
import { validate, ValidationError } from '$lib/validation';

export async function load({ params, fetch, depends }) {
	depends('api:inodes');

	const api_url =
		`${env.API_ENDPOINT}/inodes` +
		`?id=eq.${params.id}` +
		`&select=id,name,is_public,type,from_page,to_page,ancestors(id,name)`;

	const res = await fetch(api_url);
	const inodes = await res.json();
	const inode = inodes[0];

	return {
		...inode
	};
}

export const actions = {
	update: async ({ request, fetch, params }) => {
		try {
			const data = await validate(request, schema);

			const response = await fetch(`${env.API_ENDPOINT}/inodes?id=eq.${params.id}`, {
				method: 'PATCH',
				body: JSON.stringify({ is_indexed: false, ...data }),
				headers: { 'Content-Type': 'application/json' }
			});
			if (response.status != 204) {
				const data = await response.json();
				throw new Error(data.message);
			}
		} catch (err) {
			if (err instanceof ValidationError) {
				return fail(400, err.format());
			}
			throw err;
		}
	}
} satisfies Actions;
