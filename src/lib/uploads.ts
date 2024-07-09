
import type { ServerLoadEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private'

const PAGE_SIZE = 50

export async function load_files({ fetch, url, params }: ServerLoadEvent) {
    // Try to fetch requested page of items
    const param = url.searchParams.get('page')
    const page = param ? parseInt(param) - 1 : 0;

    const headers = {
        'range-unit': 'items',
        // can be "exact" or "planned", planned uses postgres statistics table
        // and is not exact, it's fast though
        prefer: 'count=exact',
        range: `${page * PAGE_SIZE}-${(page + 1) * PAGE_SIZE - 1}`
    }
    
    const api_url = `${env.API_ENDPOINT}/files`
        + `?is_uploaded=eq.true` 
        + (params.id ? `&folder_id=eq.${params.id}` : '&folder_id=is.null')
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

