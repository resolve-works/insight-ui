
import {fail, redirect} from '@sveltejs/kit';
import type {Actions} from './$types';
import {env} from '$env/dynamic/private'
import {parse_content_range, PAGE_SIZE} from '$lib/pagination';
import {validate, ValidationError} from '$lib/validation';
import {schema} from '$lib/validation/conversation';

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

async function create_conversation({request, fetch, cookies}: RequestEvent) {
    try {
        const data = await validate(request, schema)

        const api_url = new URL(`${env.API_ENDPOINT}/rpc/create_conversation`)
        api_url.searchParams.set('select', 'id')

        const res = await fetch(api_url, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
            }
        })

        if (res.status !== 200) {
            throw new Error(await res.text())
        }

        const conversations = await res.json()
        const conversation = conversations[0]

        return redirect(303, `/conversations/${conversation.id}`);
    } catch (err) {
        if (err instanceof ValidationError) {
            return fail(400, err.format())
        }
        throw err
    }
}

export const actions = {
    create_conversation,
} satisfies Actions;
