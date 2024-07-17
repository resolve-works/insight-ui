
import { Channel } from '$lib/amqp.js';
import type { Actions } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private'
import { schema } from '$lib/validation/inode'
import { validate, ValidationError } from '$lib/validation';

export async function load({ params, fetch, depends }) {
    depends('api:inodes')

    const res = await fetch(`${env.API_ENDPOINT}/inodes`
        + `?id=eq.${params.id}`
        + `&select=id,name,ancestors(id,name)`)
    const inodes = await res.json();
    const inode = inodes[0]

    return {
        ...inode,
    }
}

export const actions = {
    update_name: async ({ request, fetch, params, cookies }) => {
        try {
            const data = await validate(request, schema);

            const response = await fetch(`${env.API_ENDPOINT}/inodes?id=eq.${params.id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' }
            })
            // TODO - handle error

            const channel = await Channel.connect(cookies)
            channel.publish('index_inode', { id: params.id });
            await channel.close();
        } catch(err) {
            if(err instanceof ValidationError) {
                return fail(400, err.format())
            }
            throw err
        }
    },
} satisfies Actions;
