import { env } from '$env/dynamic/private'
import type { Actions } from './$types';
import { sign } from '$lib/sign';
import { Channel } from '$lib/amqp';
import { pagerange_schema, name_schema, pagerange_refinement } from '$lib/validation/document';
import { validate, ValidationError } from '$lib/validation/index.js';
import { fail } from '@sveltejs/kit';

export async function load({ params, fetch, cookies, depends }) {
    depends('api:inodes')

    const api_url = `${env.API_ENDPOINT}/inodes`
        + `?id=eq.${params.id}`
        + `&select=id,owner_id,name,path,file_id,files(from_page,to_page),ancestors(id,name),inodes(id,name,files(is_ready))`

    const res = await fetch(api_url)
    const inodes = await res.json();
    const inode = inodes[0]
    const { owner_id, path, file_id } = inode

    // TODO If children, don't sign file path
    return { 
        url: file_id ? sign(`users/${owner_id}/${path}/optimized`, cookies) : undefined,
        ...inode
    }
}

export const actions = {
    // Create new document
    create: async ({ request, fetch, params, cookies }) => {
        const res = await fetch(`${env.API_ENDPOINT}/files?id=eq.${params.id}&select=number_of_pages`)
        const files = await res.json();
        const { number_of_pages } = files[0];

        const schema = pagerange_schema(number_of_pages)
            .merge(name_schema)
            .superRefine(pagerange_refinement)

        try {
            const data = await validate(request, schema)

            const response = await fetch(`${env.API_ENDPOINT}/documents`, {
                method: 'POST',
                body: JSON.stringify({
                    file_id: params.id,
                    name: data.name,
                    // Computers index by 0
                    from_page: data.from_page - 1,
                    to_page: data.to_page,
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
            if(err instanceof ValidationError) {
                return fail(400, err.format())
            }
            throw err
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
