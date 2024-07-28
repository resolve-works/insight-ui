import type {Actions} from './$types';
import {env} from '$env/dynamic/private'
import {sign} from '$lib/sign';
import {create_folder, upload, remove} from '../';
import type {ServerLoadEvent} from '@sveltejs/kit';

async function get_highlights({params, fetch, url}: ServerLoadEvent) {
    const query = url.searchParams.get('query');
    const param = url.searchParams.get('page')
    const page = param ? parseInt(param) : 1;

    if (!query) {
        return []
    }

    const res = await fetch(`${env.OPENSEARCH_ENDPOINT}/inodes/_search`, {
        method: 'post',
        headers: {'Content-Type': 'application/json', },
        body: JSON.stringify({
            _source: {excludes: ["pages"]},
            query: {
                bool: {
                    must: [
                        // Get highlights for this document
                        {ids: {values: [params.id.toString()]}},
                        {
                            nested: {
                                path: "pages",
                                query: {
                                    bool: {
                                        must: [
                                            {
                                                query_string: {
                                                    query,
                                                    default_field: "pages.contents"
                                                }
                                            },
                                            {
                                                // Only get highlights for current page
                                                term: {
                                                    "pages.index": page - 1,
                                                }
                                            },
                                        ]
                                    }
                                },
                                inner_hits: {
                                    highlight: {
                                        "pre_tags": [""],
                                        "post_tags": [""],
                                        fields: {
                                            "pages.contents": {
                                                fragment_size: 1,
                                                number_of_fragments: 100,
                                            }
                                        },
                                    },
                                },
                            },
                        }
                    ],
                }
            }
        }),
    })

    const body = await res.json()
    if (res.status !== 200) {
        throw new Error(`Invalid response from opensearch. ${body.error.type}: ${body.error.reason}`)
    }

    try {
        return body.hits.hits[0].inner_hits.pages.hits.hits[0].highlight["pages.contents"]
    } catch (e) {
        console.error(e)
        return []
    }
}

export async function load(event: ServerLoadEvent) {
    const {params, fetch, cookies, depends} = event
    depends('api:inodes')

    const api_url = `${env.API_ENDPOINT}/inodes`
        + `?id=eq.${params.id}`
        + `&select=id,owner_id,name,path,files(from_page,to_page),ancestors(id,name)`

    const res = await fetch(api_url)
    const inodes = await res.json();
    const inode = inodes[0]
    const {owner_id, path, files} = inode

    // This is a folder, there is no extra information we need
    if (!files) {
        return inode
    }

    const highlights = await get_highlights(event)

    return {
        url: sign(`users/${owner_id}/${path}/optimized`, cookies),
        highlights: [...new Set(highlights)],
        ...inode,
    }
}

export const actions = {
    create_folder,
    upload,
    remove,
} satisfies Actions;
