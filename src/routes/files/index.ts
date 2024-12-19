import { env } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';
import { schema } from '$lib/validation/inode';
import { validate, ValidationError } from '$lib/validation';
import { fail } from '@sveltejs/kit';

export async function create_folder({ request, fetch }: RequestEvent) {
	try {
		const data = await validate(request, schema);

		const response = await fetch(`${env.API_ENDPOINT}/inodes`, {
			method: 'POST',
			body: JSON.stringify(data),
			headers: {
				'Content-Type': 'application/json'
			}
		});
		if (response.status != 201) {
			const details = await response.json();
			if (details.code == '23505') {
				const errors = {
					name: { _errors: ['Path must be unique'] }
				};

				throw new ValidationError(errors, data);
			}

			if (details.code == '23514') {
				const errors = {
					name: { _errors: ['Path can not contain slash characters'] }
				};

				throw new ValidationError(errors, data);
			}

			throw new Error(details.message);
		}
	} catch (err) {
		if (err instanceof ValidationError) {
			return fail(400, err.format());
		}
		throw err;
	}
}

export async function remove({ request, fetch }: RequestEvent) {
	const data = await request.formData();
	const id = data.get('id');

	if (!id) {
		throw new Error('missing "id" in form data');
	}

	await fetch(`${env.API_ENDPOINT}/inodes?id=eq.${id}`, { method: 'DELETE' });
}
