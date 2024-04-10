
import { env } from '$env/dynamic/private'
import { sign } from '$lib/sign.ts';

export async function load({ params, fetch, cookies }) {
    const res = await fetch(`${env.API_ENDPOINT}/documents?id=eq.${params.id}`)
    const documents = await res.json();
    const document = documents[0]

    return {
        ...document,
        number_of_pages: document.to_page - document.from_page,
        url: sign(document.path, cookies),
    }
}
