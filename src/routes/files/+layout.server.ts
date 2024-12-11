import { env } from '$env/dynamic/private';
import { parse_content_range, PAGE_SIZE } from '$lib/pagination';

export async function load({ depends, params, fetch, url }) {
	depends('api:inodes');

	const param = url.searchParams.get('page');
	const page = param ? parseInt(param) : 1;

	const api_url = new URL(`${env.API_ENDPOINT}/inodes`);
	api_url.searchParams.set(
		'select',
		'id,name,parent_id,type,path,is_indexed,is_ready,is_owned,error,users(name)'
	);
	api_url.searchParams.set('parent_id', `${'id' in params ? `eq.${params.id}` : `is.null`}`);
	api_url.searchParams.set('order', 'type.asc,created_at.desc');
	api_url.searchParams.set('limit', PAGE_SIZE.toString());
	api_url.searchParams.set('offset', ((page - 1) * PAGE_SIZE).toString());

	const res = await fetch(api_url, { headers: { prefer: 'count=exact' } });
	const inodes = await res.json();

	// Get total items from response
	const pagination = parse_content_range(res.headers.get('content-range'));

	return {
		inodes,
		page,
		parent_id: params.id ? parseInt(params.id) : undefined,
		...pagination
	};
}
