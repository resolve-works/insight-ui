
import { env } from '$env/dynamic/private'
import { sign } from '$lib/sign.ts';

export async function load({ params, fetch, locals }) {
    const res = await fetch(`${env.API_ENDPOINT}/documents?id=eq.${params.id}`)
    const documents = await res.json();
    const document = documents[0]

    return {
        ...document,
        url: sign(document.path, locals),
    }
}
