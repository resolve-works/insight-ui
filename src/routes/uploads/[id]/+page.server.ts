import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { env } from '$env/dynamic/private'
import type { Actions } from './$types';
import { sign } from '$lib/sign';
import { Channel } from '$lib/amqp';

const schema = (number_of_pages: number) => {
}
export async function load({ params, fetch, cookies, depends }) {
    depends('api:files')

    const res = await fetch(`${env.API_ENDPOINT}/files?id=eq.${params.id}&select=name,path,number_of_pages,documents(id,name,path,from_page,to_page,is_ingested,is_embedded,is_indexed)`)
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
                from_page: document.from_page + 1,
                is_ready: document.is_ingested && document.is_indexed && document.is_embedded,
            }
        }),
        url: sign(path, cookies),
    }
}

export const actions = {
    // Create new document
    create: async ({ request, fetch, params, cookies }) => {
        const res = await fetch(`${env.API_ENDPOINT}/files?id=eq.${params.id}&select=number_of_pages`)
        const files = await res.json();
        const { number_of_pages } = files[0];

        const schema = z
            .object({
                name: z.string(),
                from_page: z.coerce.number().int().gte(1).lte(number_of_pages),
                to_page: z.coerce.number().int().gte(1).lte(number_of_pages),
            })
            .required({ from_page: true, to_page: true })
            .superRefine((data, context) => {
                if(data.from_page > data.to_page) {
                    context.addIssue({
                        message: "Number must be smaller or equal to last page",
                        path: ["from_page"],
                        code: z.ZodIssueCode.too_big,
                        type: "number",
                        maximum: data.to_page,
                        inclusive: true,
                    })
                    context.addIssue({
                        message: "Number must be greater or equal to first page",
                        path: ["to_page"],
                        code: z.ZodIssueCode.too_small,
                        type: "number",
                        minimum: data.from_page,
                        inclusive: true,
                    })
                }
            })

        const form_data = Object.fromEntries((await request.formData()).entries())

        try {
            const data = schema.parse(form_data)

            const response = await fetch(`${env.API_ENDPOINT}/documents`, {
                method: 'POST',
                body: JSON.stringify({
                    file_id: params.id,
                    name: data.name,
                    to_page: data.to_page,
                    // Computers index by 0
                    from_page: data.from_page - 1,
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
        } catch(err) {
            if( ! (err instanceof z.ZodError)) {
                throw err
            }

            return fail(400, { 
                data: form_data, 
                errors: err.format() 
            })
        }
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
