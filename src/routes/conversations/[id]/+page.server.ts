
import type {ServerLoadEvent} from '@sveltejs/kit';
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


    const url = new URL(`${env.API_ENDPOINT}/conversations`)
    const sources = `sources(similarity,...pages(index,...inodes(id,name,...files(from_page))))`
    url.searchParams.set('select', `prompts(query,response,${sources}),inodes(path)`)
    url.searchParams.set('prompts.order', 'created_at.asc')
    url.searchParams.set('prompts.sources.order', 'similarity.asc')
    url.searchParams.set('id', `eq.${params.id}`)

    const res = await fetch(url)
    if (res.status !== 200) {
        throw new Error(await res.text())
    }
    const conversations = await res.json()
    const conversation = conversations[0]

    const options = await get_folder_options(event)

    return {
        paths: conversation.inodes.map((inode: {path: string}) => inode.path),
        ...conversation,
        options
    }
}

async function embed(input: string) {
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

async function answer_query_with_context(query: string, context: string) {
    const prompt = `Given the following context information:
"""
${context}
"""

And the following query: 
"""
${query}
"""

Answer the query using only the context information, not using prior knowledge.`

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

async function create_prompt(fetch: Function, conversation_id: number, query: string) {
    const embedding = await embed(query)

    const url = new URL(`${env.API_ENDPOINT}/prompts`)
    url.searchParams.set('select', 'id')

    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({conversation_id, query, embedding, }),
        headers: {
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    })
    if (response.status != 201) {
        throw new Error(await response.text())
    }

    const prompts = await response.json()
    return prompts[0]
}

/*
 * Substantiate prompt adds source pages to the prompts based on the filtered
 * context of the conversation the prompt is a part of
 */
async function substantiate_prompt(fetch: Function, prompt_id: number, similarity_top_k: number = 3) {
    const url = new URL(`${env.API_ENDPOINT}/rpc/substantiate_prompt`)
    url.searchParams.set('select', 'page_id,similarity,...pages(contents)')

    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({prompt_id, similarity_top_k, }),
        headers: {
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    })
    if (response.status != 200) {
        throw new Error(await response.text())
    }

    return response.json()
}

async function set_prompt_answer(fetch: Function, prompt_id: number, answer: string) {
    const url = new URL(`${env.API_ENDPOINT}/prompts`)
    url.searchParams.set('id', `eq.${prompt_id}`)

    const response = await fetch(url, {
        method: "PATCH",
        body: JSON.stringify({response: answer}),
        headers: {
            'Content-Type': 'application/json',
        }
    })
    if (response.status != 204) {
        throw new Error(await response.text())
    }
}

export const actions = {
    answer_prompt: async ({request, fetch, params}) => {
        try {
            const data = await validate(request, schema)

            // Create prompt and add sources to it
            const prompt = await create_prompt(fetch, parseInt(params.id), data.query)
            const sources = await substantiate_prompt(fetch, prompt.id, data.similarity_top_k)

            // Create context from found pages & answer prompt
            const context = sources
                .map((source: Record<string, any>) => source.contents)
                .join('\n\n')
            const answer = await answer_query_with_context(data.query, context)

            await set_prompt_answer(fetch, prompt.id, answer)
        } catch (err) {
            if (err instanceof ValidationError) {
                return fail(400, err.format())
            }
            throw err
        }

    }
} satisfies Actions
