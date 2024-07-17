
import { Channel } from '$lib/amqp.js';
import type { Actions } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private'
import { name_schema, pagerange_schema, pagerange_refinement } from '$lib/validation/document'
import { validate, ValidationError } from '$lib/validation';

export async function load({ params, fetch, depends }) {
    depends('api:inodes')

    const res = await fetch(`${env.API_ENDPOINT}/inodes`
        + `?id=eq.${params.id}`
        + `&select=id,name,files(id,from_page,to_page,is_ready),ancestors(id,name)`)
    const inodes = await res.json();
    const inode = inodes[0]

    return {
        ...inode,
    }
}

export const actions = {
    update_name: async ({ request, fetch, params, cookies }) => {
        try {
            const data = await validate(request, name_schema);

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

    update_split: async ({ request, fetch, params, cookies }) => {
        const res = await fetch(`${env.API_ENDPOINT}/documents?id=eq.${params.id}&select=from_page,to_page,files(number_of_pages)`)
        const documents = await res.json();
        const { from_page, to_page } = documents[0]
        const { number_of_pages } = documents[0].files

        const schema = pagerange_schema(number_of_pages)
            .superRefine(pagerange_refinement)

        try {
            const data = await validate(request, schema)

            // Computers index from 0
            data.from_page = data.from_page - 1;

            // Don't update when nothing changed
            if(data.from_page == from_page && data.to_page == to_page) {
                return { success: true }
            }

            const response = await fetch(`${env.API_ENDPOINT}/documents?id=eq.${params.id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' }
            })

            const channel = await Channel.connect(cookies)
            channel.publish('ingest_document', { id: params.id });
            await channel.close();
        } catch(err) {
            if(err instanceof ValidationError) {
                return fail(400, err.format())
            }
            throw err
        }
    }
} satisfies Actions;
