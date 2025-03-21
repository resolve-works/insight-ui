import { env } from '$env/dynamic/private';
import { parse_array_param } from '$lib/validation';
import { PAGE_SIZE, calculate_pagination } from '$lib/pagination';

export async function load({ url, fetch }) {
	const query = url.searchParams.get('query') ?? undefined;
	const folders = parse_array_param(url.searchParams.get('folders'));
	const page = parseInt(url.searchParams.get('page') ?? '1');

	const must: Object[] = [
		{ term: { join_field: 'inode' } },
		{ term: { type: 'file' } },
		{ bool: { should: folders.map((folder) => ({ term: { folder: folder } })) } }
	];

	// When we have a text query, search for page contents
	if (query) {
		must.push({
			has_child: {
				type: 'page',
				query: {
					bool: {
						must: [
							{ term: { join_field: 'page' } },
							{ query_string: { query, default_field: 'contents' } }
						]
					}
				},
				inner_hits: {
					_source: { excludes: ['contents', 'embedding'] },
					highlight: {
						fields: {
							contents: {
								fragment_size: 150,
								type: 'fvh'
							}
						}
					}
				}
			}
		});
	}

	const res = await fetch(`${env.OPENSEARCH_ENDPOINT}/inodes/_search`, {
		method: 'post',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			from: page - 1,
			size: PAGE_SIZE,
			track_total_hits: true,
			// Don't return all page contents
			query: {
				bool: { must }
			}
		})
	});

	const body = await res.json();
	if (res.status !== 200) {
		console.error(body.error);
		throw new Error(`Invalid response from opensearch. ${body.error.type}: ${body.error.reason}`);
	}

	return {
		...calculate_pagination(body.hits.total.value, page),
		query,
		folders,
		files: body.hits.hits.map((hit: Record<string, any>) => {
			return {
				id: hit._id,
				filename: hit._source.filename,
				pages:
					'inner_hits' in hit
						? hit.inner_hits.page.hits.hits
								.filter((page: Record<string, any>) => 'highlight' in page)
								.map((page: Record<string, any>) => {
									return {
										// Humans index from 1
										index: page['_source']['index'] + 1,
										highlights: page['highlight']['contents']
									};
								})
						: []
			};
		})
	};
}
