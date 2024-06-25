
import type { ServerLoadEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private'

const PAGE_SIZE = 100

export async function load_files({ fetch, url }: ServerLoadEvent, folder_id: string | undefined = undefined) {
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
        + (folder_id ? `&folder_id=eq.${folder_id}` : '')
        + `&select=id,name,number_of_pages,documents(id,name,is_ready)` 
        + `&order=created_at.desc`

    const res = await fetch(api_url, { headers })

    // Get total items from response
    const content_range = res.headers.get('content-range')
    if( ! content_range) {
        throw new Error('Content range header not found')
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

export async function load_folders({ fetch }: ServerLoadEvent, parent_id: string | undefined = undefined) {
    const api_url = `${env.API_ENDPOINT}/folders`
        + `?select=id,name` 
        + `&parent_id=` + (parent_id ? `eq.${parent_id}` : 'is.null')
        + `&order=created_at.desc`

    const res = await fetch(api_url)
    const folders = await res.json();

    return { folders }
}

