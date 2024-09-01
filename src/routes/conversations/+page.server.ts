
import {env} from '$env/dynamic/private'
import {parse_content_range, PAGE_SIZE} from '$lib/pagination';

export async function load({depends, fetch, url}) {
    depends('api:conversations')

    const param = url.searchParams.get('page')
    const page = param ? parseInt(param) : 1;

    const api_url = new URL(`${env.API_ENDPOINT}/conversations`)
    api_url.searchParams.set('select', 'id,created_at')
    api_url.searchParams.set('order', 'created_at.desc')
    api_url.searchParams.set('limit', PAGE_SIZE.toString())
    api_url.searchParams.set('offset', ((page - 1) * PAGE_SIZE).toString())

    const res = await fetch(api_url, {headers: {prefer: 'count=exact'}})
    const conversations = await res.json();

    // Get total items from response
    const pagination = parse_content_range(res.headers.get('content-range'))

    return {
        conversations,
        page,
        ...pagination
    }
}

