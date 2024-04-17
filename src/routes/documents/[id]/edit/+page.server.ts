
import { Channel } from '$lib/amqp.js';
import type { Actions } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private'
import { z } from 'zod';
import { name_schema, pagerange_schema, pagerange_refinement } from '$lib/validation/document'

export async function load({ params, fetch }) {
    const res = await fetch(`${env.API_ENDPOINT}/documents?id=eq.${params.id}&select=id,name,from_page,to_page,is_ingested,is_indexed,is_embedded,file_id,files(number_of_pages,name)`)
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
        const res = await fetch(`${env.API_ENDPOINT}/documents?id=eq.${params.id}&select=files(number_of_pages)`)
        const documents = await res.json();
        const { number_of_pages } = documents[0].files

        const schema = pagerange_schema(number_of_pages)
            .superRefine(pagerange_refinement)

        const form_data = Object.fromEntries((await request.formData()).entries())

        try {
            const data = schema.parse(form_data)

            const response = await fetch(`${env.API_ENDPOINT}/documents`, {
                method: 'PATCH',
                body: JSON.stringify({ from_page: data.from_page - 1, to_page: data.to_page }),
                headers: { 'Content-Type': 'application/json' }
            })

            const channel = await Channel.connect(cookies)
            channel.publish('ingest_document', { id: params.id });
            await channel.close();
        } catch(err) {
            if( ! (err instanceof z.ZodError)) {
                throw err
            }

            return fail(400, { 
                data: form_data, 
                errors: err.format() 
            })
        }
    }
} satisfies Actions;
