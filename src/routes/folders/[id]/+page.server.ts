
import { load_files } from '$lib/uploads';
import { env } from '$env/dynamic/private'

export async function load(event) {
    const { depends, fetch } = event
    depends('api:files')
    depends('api:folders')

    const folder_id = event.params.id;

    const api_url = `${env.API_ENDPOINT}/folders`
        + `?select=id,name,children(id, name)` 
        + `&id=eq.${folder_id}`
        + `&order=created_at.desc`

    const res = await fetch(api_url)
    const folders = await res.json();
    const { children, name } = folders[0];

    return {
        ...await load_files(event, folder_id),
        children,
        name,
    } 
}
