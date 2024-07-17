import { env } from '$env/dynamic/private'
import { sign } from '$lib/sign';

export async function load({ params, fetch, cookies, depends }) {
    depends('api:inodes')

    const api_url = `${env.API_ENDPOINT}/inodes`
        + `?id=eq.${params.id}`
        + `&select=id,owner_id,name,path,file_id,files(from_page,to_page),ancestors(id,name),inodes(id,name,files(is_ready))`

    const res = await fetch(api_url)
    const inodes = await res.json();
    const inode = inodes[0]
    const { owner_id, path, file_id } = inode

    // TODO If children, don't sign file path
    return { 
        url: file_id ? sign(`users/${owner_id}/${path}/optimized`, cookies) : undefined,
        ...inode
    }
}
