import { env } from '$env/dynamic/private';

function parse_folders(param: string | null) {
	if (!param) {
		return [];
	}

	try {
		const folders = JSON.parse(param);
		if (!Array.isArray(folders)) {
			throw Error('Expected array');
		}

		if (!folders.every((f) => typeof f == 'string' && f.at(0) == '/')) {
			throw Error('Expected array of paths starting with "/"');
		}

		return folders;
	} catch (_) {
		return [];
	}
}

export async function load({ url, fetch }) {
	const query = url.searchParams.get('query');
	const folders = parse_folders(url.searchParams.get('folders'));

	const must: Record<string, any>[] = [
		{
			bool: {
				should: folders.map((folder) => ({ term: { folder: folder } }))
			}
		}
	];

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
			_source: { excludes: ['pages'] },
			aggs: { folder: { terms: { field: 'folder' } } },
			query: { term: { type: 'file' } },
			post_filter: { bool: { must } }
		})
	});

	const body = await res.json();
	if (res.status !== 200) {
		throw new Error(`Invalid response from opensearch. ${body.error.type}: ${body.error.reason}`);
	}

	return {
		total: body.hits.total.value,
		options: body.aggregations.folder.buckets.map((bucket: Record<string, any>) => ({
			label: bucket.key,
			...bucket
		})),
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
