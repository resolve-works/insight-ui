import { env } from '$env/dynamic/private'
import type { Actions } from './$types';
import { sign } from '$lib/sign';
import { Channel } from '$lib/amqp.js';
import type { LoadEvent } from '@sveltejs/kit';
import { schema } from '$lib/validation/folder';
import { validate, ValidationError } from '$lib/validation';
import { fail } from '@sveltejs/kit';

const PAGE_SIZE = 100

async function load_files({ fetch, url }: LoadEvent) {
    // Try to fetch requested page of items
    const param = url.searchParams.get('page')
    const page = param ? parseInt(param) : 1;

    const headers = {
        'range-unit': 'items',
        // can be "exact" or "planned", planned uses postgres statistics table
        // and is not exact, it's fast though
        prefer: 'count=exact',
        range: `${(page - 1) * PAGE_SIZE}-${page * PAGE_SIZE - 1}`
    }
    
    const api_url = `${env.API_ENDPOINT}/files`
        + `?is_uploaded=eq.true` 
        + `&select=id,name,number_of_pages,documents(id,name,is_ready)` 
        + `&order=created_at.desc`

    const res = await fetch(api_url, { headers })

    // Get total items from response
    const content_range = res.headers.get('content-range')
    if( ! content_range) {
        throw new Error('Content')
    }
    const [item_range, total] = content_range.split('/')
    const amount_of_items = parseInt(total)
    const [first_item, last_item] = item_range === '*' ? [undefined, undefined] : item_range.split('-').map(i => parseInt(i))
    const amount_of_pages = Math.ceil(amount_of_items / PAGE_SIZE)

    const files = await res.json()

    return { 
        files,
        first_item,
        last_item,
        amount_of_items,
        page,
        amount_of_pages,
    }
}

async function load_folders({ fetch }: LoadEvent) {
    const api_url = `${env.API_ENDPOINT}/folders`
        + `?select=id,name` 
        + `&parent_id=is.null`
        + `&order=created_at.desc`

    const res = await fetch(api_url)
    const folders = await res.json();

    return { folders }
}

export async function load(event: LoadEvent) {
    event.depends('api:files')
    event.depends('api:folders')

    return {
        ...await load_files(event),
        ...await load_folders(event)
    } 

}

export const actions = {
    // Create new folder at root
    create_folder: async ({ request, fetch }) => {
        try {
            const data = await validate(request, schema)

            const response = await fetch(`${env.API_ENDPOINT}/folders`, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation',
                }
            })
            // TODO error handling
        } catch(err) {
            if(err instanceof ValidationError) {
                return fail(400, err.format())
            }
            throw err
        }
    },

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
            if(response.status !== 201) {
                throw new Error(`Error creating file record: "${await response.text()}"`)
            }
            const files = await response.json()
            const file = files[0]

            // Stream the file to S3 backend
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
                throw new Error(`Error streaming response to storage backend: "${await storage_response.text()}"`)
            }

            const patch_response = await fetch(`${env.API_ENDPOINT}/files?id=eq.${file.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ is_uploaded: true }),
                headers: { 'Content-Type': 'application/json', }
            })
            // TODO error handling

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
