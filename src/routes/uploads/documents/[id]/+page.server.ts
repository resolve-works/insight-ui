
import { env } from '$env/dynamic/private'
import { sign } from '$lib/sign.ts';

export async function load({ params, fetch, cookies }) {

    const api_url = `${env.API_ENDPOINT}/documents`
        + `?id=eq.${params.id}`
        + `&select=*,files(id,name,folders(id,name,parents(id,name)))` 

    const res = await fetch(api_url)
    const documents = await res.json();
    const document = documents[0]

    // Create single parents array
    const parents = [];
    if(document.files.folders) {
        if(document.files.folders.parents) {
            parents.push(...document.files.folders.parents)
        }

        parents.push(document.files.folders)
    }


    return {
        ...document,
        parents,
        number_of_pages: document.to_page - document.from_page,
        url: sign(document.path, cookies),
    }
}
