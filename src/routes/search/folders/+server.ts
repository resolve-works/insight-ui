import { env } from '$env/dynamic/private';
import { error, json } from '@sveltejs/kit';
import { parse_array_param } from '$lib/validation';

export async function GET({ fetch, url }) {
	const name = url.searchParams.get('name');
	const query = url.searchParams.get('query');
	const folders = parse_array_param(url.searchParams.get('folders'));

	const must: Record<string, any>[] = [{ term: { type: 'file' } }];

	// Allow user to filter for folders
	if (name) {
		must.push({ wildcard: { folder: { value: `*${name}*`, case_insensitive: true } } });
	}

	// Only show user folders that contain files that they searched for
	if (query) {
		must.push({
			nested: { path: 'pages', query: { query_string: { query, default_field: 'pages.contents' } } }
		});
	}

	const res = await fetch(`${env.OPENSEARCH_ENDPOINT}/inodes/_search`, {
		method: 'post',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			size: 0,
			aggs: { folder: { terms: { field: 'folder', size: 50 } } },
			// Do folder filtering after the query stage so that aggregations contain all folders
			post_filter: {
				bool: {
					must: [{ bool: { should: folders.map((folder) => ({ term: { folder: folder } })) } }]
				}
			},
			query: { bool: { must } }
		})
	});

	const body = await res.json();
	if (res.status !== 200) {
		console.log(body);
		return error(500, `Invalid response from opensearch. ${body.error.type}: ${body.error.reason}`);
	}

	return json(body.aggregations.folder.buckets);
}
