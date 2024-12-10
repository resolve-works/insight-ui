import { env } from '$env/dynamic/private';
import { parse_folders } from '$lib/search';

export async function load({ url, fetch }) {
	const query = url.searchParams.get('query');
	const folders = parse_folders(url.searchParams.get('folders'));

	const must: Record<string, any>[] = [
		{
			bool: {
				should: folders.map((folder) => ({ term: { folder: folder } }))
			}
		},
		{ term: { type: 'file' } }
	];

	// When we have a text query, search for page contents
	if (query) {
		must.push({
			nested: {
				path: 'pages',
				query: {
					query_string: {
						query,
						default_field: 'pages.contents'
					}
				},
				inner_hits: {
					highlight: {
						fields: {
							'pages.contents': {
								fragment_size: 200
							}
						}
					}
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
			// Don't return all page contents
			_source: { excludes: ['pages'] },
			query: { bool: { must } }
		})
	});

	const body = await res.json();
	if (res.status !== 200) {
		throw new Error(`Invalid response from opensearch. ${body.error.type}: ${body.error.reason}`);
	}

	return {
		total: body.hits.total.value,
		//options: body.aggregations.folder.buckets.map((bucket: Record<string, any>) => ({
		//label: bucket.key,
		//...bucket
		//})),
		files: body.hits.hits.map((hit) => {
			return {
				id: hit._id,
				filename: hit._source.filename,
				pages:
					'inner_hits' in hit
						? hit.inner_hits.pages.hits.hits
								.filter((page) => 'highlight' in page)
								.map((page) => {
									return {
										// Humans index from 1
										index: page['_source']['index'] + 1,
										highlights: page['highlight']['pages.contents']
									};
								})
						: []
			};
		})
	};
}
