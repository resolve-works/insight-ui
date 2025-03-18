import { env } from '$env/dynamic/private';

export async function update_filters(fetch: Function, conversation_id: number, folders: string[]) {
	const url = new URL(`${env.API_ENDPOINT}/rpc/set_conversation_filters`);

	const response = await fetch(url, {
		method: 'POST',
		body: JSON.stringify({ conversation_id, folders }),
		headers: {
			'Content-Type': 'application/json'
		}
	});
	if (response.status != 204) {
		throw new Error(await response.text());
	}
}
