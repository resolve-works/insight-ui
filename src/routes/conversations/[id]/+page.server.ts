
import type {ServerLoadEvent, RequestEvent} from '@sveltejs/kit';
import {env} from '$env/dynamic/private'
import type {Actions} from './$types';
import {fail} from '@sveltejs/kit';
import {validate, ValidationError} from '$lib/validation';
import {schema} from '$lib/validation/prompt';

const SYSTEM_PROMPT = `You are a helpful AI assistant, optimized for finding information in document
collections. You will be provided with several pages from a document
collection, and are expected to generate an answer based only on these pages,
without using any prior knowledge.`

async function get_folder_options(event: ServerLoadEvent) {
    const {fetch} = event
    const res = await fetch(`${env.OPENSEARCH_ENDPOINT}/inodes/_search`, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "_source": {excludes: ["pages"]},
            aggs: {folder: {terms: {field: "folder"}}},
            query: {term: {type: "file", }},
        }),
    })

    const body = await res.json()
    if (res.status !== 200) {
        throw new Error(`Invalid response from opensearch. ${body.error.type}: ${body.error.reason}`)
    }

    return body.aggregations.folder.buckets.map((bucket: Record<string, any>) => ({
        label: bucket.key,
        ...bucket
    }))
}

export async function load(event) {
    const {fetch, depends, params} = event
    depends('api:conversations')

    const url = new URL(`${env.API_ENDPOINT}/prompts`)
    url.searchParams.set('select', 'query,response,sources(similarity,...pages(index,...inodes(id,name,...files(from_page))))')
    url.searchParams.set('order', 'created_at.desc')
    url.searchParams.set('sources.order', 'similarity.asc')
    url.searchParams.set('conversation_id', `eq.${params.id}`)

    const res = await fetch(url)
    const prompts = await res.json()

    const options = await get_folder_options(event)

    return {prompts, options}
}

async function embed_query(input: string) {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({input, model: "text-embedding-3-small", })
    })

    if (response.status !== 200) {
        throw new Error(await response.text())
    }

    return (await response.json()).data[0].embedding;
}

async function answer_query(query: string, pages: string[]) {
    const context = pages.join('\n\n')
    const prompt = `Context information is below.
---------------------
${context}
---------------------
Given only the context information, answer the query without using prior knowledge.

Query: ${query}
Answer:`

    const data = {
        model: "gpt-4-turbo",
        messages: [
            {role: "system", content: SYSTEM_PROMPT},
            {role: "user", content: prompt},
        ],
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify(data)
    })

    if (response.status !== 200) {
        throw new Error(await response.text())
    }

    return (await response.json()).choices[0].message.content;
}

async function create_prompt(event: RequestEvent) {
    const {request, fetch} = event

    try {
        const data = await validate(request, schema)
        data.embedding = await embed_query(data.query)

        // Wanted to get sources in 1 call but
        // https://github.com/PostgREST/postgrest/discussions/2933
        const url = `${env.API_ENDPOINT}/rpc/create_prompt?select=id,query`;
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        })
        if (response.status != 200) {
            throw new Error(await response.text())
        }

        return (await response.json())[0]
    } catch (err) {
        if (err instanceof ValidationError) {
            return fail(400, err.format())
        }
        throw err
    }
}

export const actions = {
    default: async (event) => {
        const {fetch} = event

        const prompt = await create_prompt(event)

        const sources_response = await fetch(`${env.API_ENDPOINT}/sources?prompt_id=eq.${prompt.id}&select=page_id,similarity,...pages(contents)`)
        const sources = await sources_response.json()

        const response = await answer_query(prompt.query, sources.map((source: Record<string, any>) => source.contents))

        const update_response = await fetch(`${env.API_ENDPOINT}/prompts?id=eq.${prompt.id}`, {
            method: "PATCH",
            body: JSON.stringify({response}),
            headers: {
                'Content-Type': 'application/json',
            }
        })
        if (update_response.status != 204) {
            throw new Error(await update_response.text())
        }
    }
} satisfies Actions
