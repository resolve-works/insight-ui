
import { env } from '$env/dynamic/private'

export async function load({ params, fetch, cookies, depends }) {
    depends('api:inodes')

    const api_url = `${env.API_ENDPOINT}/inodes`
        + `?id=eq.${params.id}`
        + `&select=id,owner_id,name,path,file_id,...files(from_page,to_page),ancestors(id,name),inodes(id,name)`

    const res = await fetch(api_url)
    const inodes = await res.json();
    const inode = inodes[0]

    // TODO If children, don't sign file path
    return { 
        ...inode
    }
}
