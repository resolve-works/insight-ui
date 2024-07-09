
import { env } from '$env/dynamic/private'
import { load_files } from '$lib/uploads';

export async function load(event) {
    const { depends, fetch, params } = event
    depends('api:files')
    depends('api:folders')

    const api_url = `${env.API_ENDPOINT}/folders`
        + `?select=id,name,children(id, name),parents(id, name)` 
        + `&id=eq.${params.id}`
        + `&order=created_at.desc`

    const res = await fetch(api_url)
    const folders = await res.json();

    return {
        ...await load_files(event),
        ...folders[0],
    } 
}
