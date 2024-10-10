import { env } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';
import { Channel } from '$lib/amqp.js';
import { schema } from '$lib/validation/inode';
import { validate, ValidationError } from '$lib/validation';
import { fail } from '@sveltejs/kit';

export async function create_folder({ request, fetch, cookies }: RequestEvent) {
	try {
		const data = await validate(request, schema);

		const response = await fetch(`${env.API_ENDPOINT}/inodes`, {
			method: 'POST',
			body: JSON.stringify(data),
			headers: {
				'Content-Type': 'application/json',
				Prefer: 'return=representation'
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

			throw new Error(details.message);
		}

		const inodes = await response.json();
		const inode = inodes[0];

		const channel = await Channel.connect(cookies);
		channel.publish('index_inode', { id: inode.id });
		await channel.close();
	} catch (err) {
		if (err instanceof ValidationError) {
			return fail(400, err.format());
		}
		throw err;
	}
}

export async function remove({ request, fetch, cookies }: RequestEvent) {
	const data = await request.formData();
	const id = data.get('id');

	if (!id) {
		throw new Error('missing "id" in form data');
	}

	await fetch(`${env.API_ENDPOINT}/inodes?id=eq.${id}`, {
		method: 'PATCH',
		body: JSON.stringify({ is_deleted: true }),
		headers: { 'Content-Type': 'application/json' }
	});

	const channel = await Channel.connect(cookies);
	channel.publish('delete_inode', { id });
	await channel.close();
}
