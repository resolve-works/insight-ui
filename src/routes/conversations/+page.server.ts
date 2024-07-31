
import type {ServerLoadEvent} from '@sveltejs/kit';
import {env} from '$env/dynamic/private'
import type {Actions} from './$types';
import {fail} from '@sveltejs/kit';
import {validate, ValidationError} from '$lib/validation';
import {schema} from '$lib/validation/prompt';
import {Channel} from '$lib/amqp';

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
    const {fetch, depends} = event
    depends('api:conversations')

    const res = await fetch(`${env.API_ENDPOINT}/prompts`
        + `?select=query,response,sources(similarity,...pages(index,...inodes(id,name,...files(from_page))))`
        + `&order=created_at.desc&sources.order=similarity.desc&limit=1`)
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
        console.log(await response.text())
        throw new Error('Could not query embedding model')
    }

    return (await response.json()).data[0].embedding;
}

export const actions = {
    default: async ({request, fetch, cookies}) => {
        try {
            const data = await validate(request, schema)

            const embeddings = await embed_query(data.query)
            console.log(embeddings)

            /*
            data = {
                "input": [encoding.encode(string) for string in batch],
                "model": "text-embedding-3-small",
            }
            response = httpx.post(
                "https://api.openai.com/v1/embeddings",
                headers=headers,
                json=data,
                timeout=30,
            )
            if response.status_code == 200:
                for embedding in response.json()["data"]:
                    yield embedding["embedding"]
                    */



        } catch (err) {
            if (err instanceof ValidationError) {
                return fail(400, err.format())
            }
            throw err
        }


        /*
        const entries = Array.from(await request.formData()).filter(([key, value]) => !!value);

        const response = await fetch(`${env.API_ENDPOINT}/prompts`, {
            method: 'POST',
            body: JSON.stringify(Object.fromEntries(entries)),
            headers: {
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        })
        const prompts = await response.json()
        const prompt = prompts[0]

        const channel = await Channel.connect(cookies)
        channel.publish('answer_prompt', {id: prompt.id});
        channel.close()
        */
    }
} satisfies Actions
