
import {env} from '$env/dynamic/private'
import type {Actions} from './$types';
import {create_folder, upload, remove} from './';

export async function load(event) {
    const {depends, fetch} = event
    depends('api:inodes')

    const api_url = `${env.API_ENDPOINT}/inodes`
        + `?select=id,name,files(is_ready)`
        + `&parent_id=is.null`
        + `&order=created_at.desc`

    const res = await fetch(api_url)
    const inodes = await res.json();

    return {inodes, }
}

export const actions = {
    create_folder,
    upload,
    remove,
} satisfies Actions;
