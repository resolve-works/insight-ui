import type {Actions} from './$types';
import {env} from '$env/dynamic/private'
import {sign} from '$lib/sign';
import {create_folder, upload, remove, parse_content_range, PAGE_SIZE} from '../';

export async function load({params, fetch, cookies, depends, url}) {
    depends('api:inodes')

    const api_url = `${env.API_ENDPOINT}/inodes`
        + `?id=eq.${params.id}`
        + `&select=id,owner_id,name,path,files(from_page,to_page),ancestors(id,name)`

    const res = await fetch(api_url)
    const inodes = await res.json();
    const inode = inodes[0]

    const {owner_id, path, files} = inode
    return {
        url: files ? sign(`users/${owner_id}/${path}/optimized`, cookies) : undefined,
        ...inode,
    }
}

export const actions = {
    create_folder,
    upload,
    remove,
} satisfies Actions;
