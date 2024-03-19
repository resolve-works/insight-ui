
import { env } from '$env/dynamic/private'
import type { Actions } from './$types';
import { Channel } from '$lib/amqp';

export async function load({ fetch, depends }) {
    depends('api:conversations')

    const res = await fetch(`${env.API_ENDPOINT}/prompts?select=query,response,sources(similarity,...pages(index,...document(id,name,from_page)))&order=created_at.desc&sources.order=similarity.desc&limit=1`)
    const prompts = await res.json()
    return { prompts }
}

export const actions = {
    default: async ({ request, fetch, cookies }) => {
        // Strip keys=>value that are empty
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
        channel.publish('answer_prompt', { id: prompt.id });
        channel.close()
    }
} satisfies Actions
