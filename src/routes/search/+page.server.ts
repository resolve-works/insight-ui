
import { env } from '$env/dynamic/private'

export async function load({ url, fetch }) {
    const query = url.searchParams.get('query');

    const res = await fetch(`${env.OPENSEARCH_ENDPOINT}/documents/_search`, {
        method: 'post',
        headers: { 
            'Content-Type': 'application/json', 
        },
        body: JSON.stringify({
            "_source": {"excludes": ["pages"]},
            "query": {
                "nested": {
                    "path": "pages",
                    "query": {
                        "query_string": {
                            "query": `${query ? query : '*'}`,
                            "default_field": "pages.contents"
                        }
                    },
                    "inner_hits": {
                        "highlight": {
                            "fields": {
                                "pages.contents": {
                                    fragment_size: 200,
                                }
                            },
                        },
                    },
                },
            },
        }),
    })

    const body = await res.json()
    return {
        query,
        total: body['hits']['total']['value'],
        documents: body['hits']['hits'].map(hit => {
            return {
                id: hit['_id'],
                filename: hit['_source']['filename'],
                pages: hit["inner_hits"]["pages"]["hits"]["hits"]
                    .filter(page => "highlight" in page)
                    .map(page => {
                        return {
                            // Humans index from 1
                            index: page['_source']['index'] + 1,
                            highlights: page["highlight"]["pages.contents"],
                        }
                    })
            }
        }),
    }
}
