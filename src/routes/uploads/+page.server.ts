
import { env } from '$env/dynamic/private'
import type { Actions } from './$types';
import { load_files, upload, create_folder, remove} from '$lib/uploads';

export async function load(event) {
    const { depends, fetch } = event
    depends('api:files')
    depends('api:folders')

    const api_url = `${env.API_ENDPOINT}/folders`
        + `?select=id,name` 
        + `&parent_id=is.null`
        + `&order=created_at.desc`

    const res = await fetch(api_url)
    const folders = await res.json();

    return {
        ...await load_files(event),
        folders,
    } 
}

export const actions = {
    create_folder,
    upload,
    remove,
} satisfies Actions;
