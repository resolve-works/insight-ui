import { env } from '$env/dynamic/private'
import type { Actions } from './$types';
import { sign } from '$lib/sign';
import { Channel } from '$lib/amqp.js';

const PAGE_SIZE = 5

export async function load({ fetch, depends, params }) {
    depends('api:files')

    const url = `${env.API_ENDPOINT}/files`
        + `?is_uploaded=eq.true` 
        + `&select=id,name,number_of_pages,documents(id,name,is_ready)` 
        + `&order=created_at.desc`

    const res = await fetch(url)

    const files = await res.json()
    return { files }
}

export const actions = {
    upload: async ({ request, fetch, cookies }) => {
        const data = await request.formData();
        const uploads: File[] = data.getAll('files') as File[]

        // Filter for 0 size files as submitting empty file input results in single 0 size file?
        for(const upload of uploads.filter(file => file.size > 0)) {
            const response = await fetch(`${env.API_ENDPOINT}/files`, {
                method: 'POST',
                body: JSON.stringify({ name: upload.name }),
                headers: { 
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation',
                }
            })
            const files = await response.json()
            const file = files[0]
            const url = sign(file.path, cookies, 'PUT')
            const storage_response = await fetch(url, { 
                method: 'PUT', 
                body: upload.stream(), 
                // @ts-ignore
                duplex: 'half',
                headers: {
                    'Content-Type': upload.type,
                    'Content-Length': upload.size.toString(),
                }
            })

            if(storage_response.status !== 200) {
                throw new Error(await storage_response.text())
            }

            const patch_response = await fetch(`${env.API_ENDPOINT}/files?id=eq.${file.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ is_uploaded: true }),
                headers: { 'Content-Type': 'application/json', }
            })

            const channel = await Channel.connect(cookies)
            channel.publish('analyze_file', { id: file.id });
            await channel.close()
        }
    },

    remove: async ({ request, fetch, cookies }) => {
        const data = await request.formData();
        await fetch(`${env.API_ENDPOINT}/files?id=eq.${data.get('id')}`, { 
            method: 'PATCH', 
            body: JSON.stringify({ is_deleted: true }),
            headers: { 'Content-Type': 'application/json' }
        })

        const channel = await Channel.connect(cookies)
        channel.publish('delete_file', { id:`${data.get('id')}` });
        await channel.close()
    },
} satisfies Actions;
