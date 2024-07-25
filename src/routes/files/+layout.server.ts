
import {env} from '$env/dynamic/private'

const PAGE_SIZE = 50

function parse_content_range(content_range: string | null) {
    if (!content_range) {
        throw new Error('Content-range header not set')
    }
    const [item_range, total] = content_range.split('/')
    const amount_of_items = parseInt(total)
    const [first_item, last_item] = amount_of_items
        ? item_range.split('-').map(i => parseInt(i))
        : [undefined, undefined]
    const amount_of_pages = Math.ceil(amount_of_items / PAGE_SIZE)

    return {first_item, last_item, amount_of_items, amount_of_pages}
}


export async function load({depends, params, fetch, url}) {
    depends('api:inodes')

    const param = url.searchParams.get('page')
    const page = param ? parseInt(param) : 1;

    const api_url = `${env.API_ENDPOINT}/inodes`
        + `?select=id,name,type,files(is_ready)`
        + `&parent_id=${'id' in params ? `eq.${params.id}` : `is.null`}`
        + `&order=type.asc,created_at.desc`
        + `&limit=${PAGE_SIZE}`
        + `&offset=${(page - 1) * PAGE_SIZE}`

    const res = await fetch(api_url, {headers: {prefer: 'count=exact'}})
    const inodes = await res.json();

    // Get total items from response
    const pagination = parse_content_range(res.headers.get('content-range'))

    return {
        inodes,
        page,
        parent_id: params.id,
        ...pagination
    }
}

