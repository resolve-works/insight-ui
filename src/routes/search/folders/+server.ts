import { env } from '$env/dynamic/private';
import { error, json } from '@sveltejs/kit';
import { parse_folders } from '$lib/search';

export async function GET({ fetch, url }) {
	const query = url.searchParams.get('query');
	const folders = parse_folders(url.searchParams.get('folders'));

	const res = await fetch(`${env.OPENSEARCH_ENDPOINT}/inodes/_search`, {
		method: 'post',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			_source: { excludes: ['pages'] },
			aggs: { folder: { terms: { field: 'folder' } } },
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
				bool: {
					must: [
						{ term: { type: 'file' } },
						{
							match: {
								folder: query
							}
						}
					]
				}
			}
		})
	});

	const body = await res.json();
	console.log(body);
	if (res.status !== 200) {
		return error(500, `Invalid response from opensearch. ${body.error.type}: ${body.error.reason}`);
	}

	return json(
		body.aggregations.folder.buckets.map((bucket: Record<string, any>) => ({
			label: bucket.key,
			...bucket
		}))
	);
}
