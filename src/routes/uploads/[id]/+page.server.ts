import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private'
import type { Actions } from './$types';

import { sign } from '$lib/sign.ts';
import { Channel } from '$lib/amqp.ts';

export async function load({ params, fetch, cookies, depends }) {
    depends('api:files')

    const res = await fetch(`${env.API_ENDPOINT}/files?id=eq.${params.id}&select=name,path,number_of_pages,documents(id,name,path,from_page,to_page,status)`)
    const files = await res.json();
    const { name, path, documents, number_of_pages } = files[0]

    return { 
        name,
        number_of_pages, 
        // Humans index from 1
        //
        // When you say "to 137" to a human, they expect 137 to be in the
        // range. We are counting to document.length, which is not in the
        // range. Therefore we don't have to increment to_page with 1
        documents: documents.map((document: Record<string, any>) => {
            return { 
                ...document, 
                from_page: document.from_page + 1 
            }
        }),
        url: sign(path, cookies) 
    }
}

export const actions = {
    // Create new document
    create: async ({ request, fetch, params, cookies }) => {
        const data = await request.formData();

        const name = data.get('name');
        const from_page = data.get('from_page');
        const to_page = data.get('to_page');
        
        const body = { name, from_page, to_page }

		if ( ! from_page || ! to_page) {
			return fail(400, body);
		}

        const response = await fetch(`${env.API_ENDPOINT}/documents`, {
            method: 'POST',
            body: JSON.stringify({
                file_id: params.id,
                name: body.name,
                to_page: parseInt(to_page.toString()),
                // Computers index by 0
                from_page: parseInt(from_page.toString()) - 1,
            }),
            headers: { 
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
            }
        })

        const documents = await response.json()
        const document = documents[0]

        const channel = await Channel.connect(cookies)
        channel.publish('ingest_document', { id: document.id });
        await channel.close();

		return { success: true };
    },

    // Remove a single document
    remove: async ({ request, fetch, cookies }) => {
        const data = await request.formData();
        await fetch(`${env.API_ENDPOINT}/documents?id=eq.${data.get('id')}`, { 
            method: 'PATCH', 
            body: JSON.stringify({ is_deleted: true }),
            headers: { 'Content-Type': 'application/json' }
        })

        const channel = await Channel.connect(cookies)
        channel.publish('delete_document', { id:`${data.get('id')}` });
        await channel.close()
    },
} satisfies Actions;
