
import { Channel } from '$lib/amqp.js';
import type { Actions } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private'
import { name_schema, pagerange_schema, pagerange_refinement } from '$lib/validation/document'
import { validate, ValidationError } from '$lib/validation';

export async function load({ params, fetch, depends }) {
    depends('api:documents')

    const res = await fetch(`${env.API_ENDPOINT}/documents?id=eq.${params.id}&select=id,name,from_page,to_page,is_ready,file_id,files(number_of_pages,name)`)
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
        try {
            const data = await validate(request, name_schema);

            const response = await fetch(`${env.API_ENDPOINT}/documents?id=eq.${params.id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' }
            })
            // TODO - handle error

            const channel = await Channel.connect(cookies)
            channel.publish('index_document', { id: params.id });
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
