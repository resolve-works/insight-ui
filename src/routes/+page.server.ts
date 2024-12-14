import { env } from '$env/dynamic/private';

export async function load({ fetch }) {
	const res = await fetch(`${env.OPENSEARCH_ENDPOINT}/inodes/_search`, {
		method: 'post',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			size: 0,
			track_total_hits: true,
			query: { term: { type: 'file' } }
		})
	});

	const body = await res.json();
	if (res.status !== 200) {
		throw new Error(`Invalid response from opensearch. ${body.error.type}: ${body.error.reason}`);
	}

	return {
		amount_of_items: body.hits.total.value
	};
}
