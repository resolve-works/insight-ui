
import type { Actions } from '@sveltejs/kit';
import { env } from '$env/dynamic/private'
import { load_files, create_folder, upload } from '$lib/uploads';

export async function load(event) {
    const { depends, fetch } = event
    depends('api:files')
    depends('api:folders')

    const folder_id = event.params.id;

    const api_url = `${env.API_ENDPOINT}/folders`
        + `?select=id,name,children(id, name),parents(id, name)` 
        + `&id=eq.${folder_id}`
        + `&order=created_at.desc`

    const res = await fetch(api_url)
    const folders = await res.json();

    return {
        ...await load_files(event, folder_id),
        ...folders[0],
    } 
}

export const actions = {
    create_folder,
    upload,
} satisfies Actions;
