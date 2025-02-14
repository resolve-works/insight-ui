import type { Actions } from './$types';
import { env } from '$env/dynamic/private';
import { sign } from '$lib/storage';
import { create_folder, remove } from '../';
import type { ServerLoadEvent } from '@sveltejs/kit';
import { parse_array_param } from '$lib/validation';

type SearchProperties = {
	highlights?: string[];
	previous_hit_index?: number;
	next_hit_index?: number;
};

function pages_query(
	id: string,
	query: string,
	must: Record<string, any>[],
	inner_hits: Record<string, any>
) {
	return {
		_source: { excludes: ['pages'] },
		query: {
			bool: {
				must: [
					// Get information for requested document
					{ ids: { values: [id] } },
					{
						nested: {
							path: 'pages',
							query: {
								bool: {
									// Always search with query
									must: [
										{ query_string: { query, default_field: 'pages.contents' } },
										// Highlight and nearest hits have differing requirements
										...must
									]
								}
							},
							inner_hits
						}
					}
				]
			}
		}
	};
}

// Get next or previous page where search query occurs
function nearest_hit_query(page: number, id: string, query: string, is_previous = false) {
	const page_index: { gt?: number; lt?: number } = {};
	if (is_previous) {
		page_index.lt = page - 1;
	} else {
		page_index.gt = page - 1;
	}

	const must = [{ range: { 'pages.index': page_index } }];

	const inner_hits = {
		size: 1,
		_source: { excludes: ['pages.contents'] },
		sort: [{ 'pages.index': { order: is_previous ? 'desc' : 'asc' } }]
	};

	return pages_query(id, query, must, inner_hits);
}

// Try to get highlights for current page and next & previous page indices where search query occurs
async function get_search_properties({ params, fetch, url }: ServerLoadEvent) {
	const query = url.searchParams.get('query');
	const param = url.searchParams.get('page');
	const page = param ? parseInt(param) : 1;

	if (!query) {
		return {};
	}

	const must = [{ term: { 'pages.index': page - 1 } }];

	const inner_hits = {
		highlight: {
			pre_tags: [''],
			post_tags: [''],
			fields: { 'pages.contents': { fragment_size: 1, number_of_fragments: 100 } }
		}
	};

	// Run multisearch
	const body = [
		pages_query(params.id!, query, must, inner_hits),
		nearest_hit_query(page, params.id!, query, true),
		nearest_hit_query(page, params.id!, query, false)
	]
		.map((query) => `{}\n${JSON.stringify(query)}\n`)
		.join('');

	const res = await fetch(`${env.OPENSEARCH_ENDPOINT}/inodes/_msearch`, {
		method: 'post',
		headers: { 'Content-Type': 'application/json' },
		body
	});

	const data = await res.json();
	for (const res of data.responses) {
		if (res.status !== 200) {
			throw new Error(`Invalid response from opensearch. ${res.error.type}: ${res.error.reason}`);
		}
	}

	const search_properties: SearchProperties = {};

	// Results are possibly non-existant for pages that don't contain query
	try {
		const highlights: string[] =
			data.responses[0].hits.hits[0].inner_hits.pages.hits.hits[0].highlight['pages.contents'];
		search_properties.highlights = [...new Set(highlights)];
	} catch {}

	// Results are possibly non-existant when there is no next or previous pages containing query
	try {
		search_properties.previous_hit_index =
			data.responses[1].hits.hits[0].inner_hits.pages.hits.hits[0]._source.index;
	} catch {}

	try {
		search_properties.next_hit_index =
			data.responses[2].hits.hits[0].inner_hits.pages.hits.hits[0]._source.index;
	} catch {}

	return search_properties;
}

export async function load(event: ServerLoadEvent) {
	const { params, fetch, cookies, depends, url } = event;
	depends('api:inodes');

	const api_url =
		`${env.API_ENDPOINT}/inodes` +
		`?id=eq.${params.id}` +
		`&select=id,name,is_owned,owner_id,path,type,from_page,to_page,ancestors(id,name),users(name)`;

	const res = await fetch(api_url, { headers: { Accept: 'application/vnd.pgrst.object+json' } });
	const inode = await res.json();
	const { owner_id, path, type } = inode;

	// This is a folder, there is no extra information we need
	if (type == 'folder') {
		return inode;
	}

	const optimized_path = path.replace(/(.+)(\/[^/.]+)(\..+)$/, '$1$2_optimized$3');
	const search_properties = await get_search_properties(event);
	return {
		url: {
			optimized: sign(`users/${owner_id}${optimized_path}`, cookies),
			original: sign(`users/${owner_id}${path}`, cookies)
		},
		...inode,
		...search_properties,
		page: parseInt(url.searchParams.get('page') ?? '1'),
		folders: parse_array_param(url.searchParams.get('folders')),
		query: url.searchParams.get('query') ?? undefined
	};
}

export const actions = { create_folder, remove } satisfies Actions;
