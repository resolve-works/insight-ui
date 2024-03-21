
import { Channel } from '$lib/amqp.js';
import type { Actions } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private'

export async function load({ params, fetch }) {
    const res = await fetch(`${env.API_ENDPOINT}/documents?id=eq.${params.id}&select=id,name,from_page,to_page,file_id,files(number_of_pages,name)`)
    const documents = await res.json();
    const document = documents[0]

    return {
        ...document,
        // Humans index from 1
        from_page: document.from_page + 1,
        is_whole_document: document.from_page == 0 && document.to_page == document.files.number_of_pages,
    }
}

export const actions = {
    update_name: async ({ request, fetch, params, cookies }) => {
        const data = await request.formData();

        const name = data.get('name');

        const response = await fetch(`${env.API_ENDPOINT}/documents`, {
            method: 'PATCH',
            body: JSON.stringify({ name }),
            headers: { 'Content-Type': 'application/json' }
        })
    },

    update_split: async ({ request, fetch, params, cookies }) => {
        const data = await request.formData();

        const from_page = data.get('from_page');
        const to_page = data.get('to_page');
        
		if ( ! from_page || ! to_page) {
			return fail(400, { name, from_page, to_page });
		}

        const body = {
            to_page: parseInt(to_page.toString()),
            // Computers index by 0
            from_page: parseInt(from_page.toString()) - 1,
        }

        const response = await fetch(`${env.API_ENDPOINT}/documents`, {
            method: 'PATCH',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        })

        const channel = await Channel.connect(cookies)
        channel.publish('ingest_document', { id: params.id });
        await channel.close();
    }
} satisfies Actions;
