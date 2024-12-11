import { env } from '$env/dynamic/private';
import { error, json } from '@sveltejs/kit';
import { parse_folders } from '$lib/search';

export async function GET({ fetch, url }) {
	const query = url.searchParams.get('query');
	const folders = parse_folders(url.searchParams.get('folders'));

	const must: Record<string, any>[] = [{ term: { type: 'file' } }];

	if (query) {
		must.push({
			wildcard: {
				folder: {
					value: `*${query}*`,
					case_insensitive: true
				}
			}
		});
	}

	const res = await fetch(`${env.OPENSEARCH_ENDPOINT}/inodes/_search`, {
		method: 'post',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			_source: { excludes: ['pages'] },
			aggs: { folder: { terms: { field: 'folder', size: 50 } } },
			// Do folder filtering after the query stage so that aggregations contain all folders
			post_filter: {
				bool: {
					must: [
						{
							bool: {
								should: folders.map((folder) => ({ term: { folder: folder } }))
							}
						}
					]
				}
			},
			query: {
				bool: { must }
			}
		})
	});

	const body = await res.json();
	if (res.status !== 200) {
		return error(500, `Invalid response from opensearch. ${body.error.type}: ${body.error.reason}`);
	}

	return json(body.aggregations.folder.buckets);
}
