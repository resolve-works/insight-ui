import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';
import { sign } from '$lib/storage';

// TODO - This does not really fit into form actions with the XHR uploaders.
// Maybe have seperate logic for those. For now, HTTP 500 means "error"
export async function POST({ request, fetch, cookies }: RequestEvent) {
	const data = await request.formData();
	const upload: File = data.get('file') as File;

	// First create a file model to check if we can upload this file
	const response = await fetch(
		`${env.API_ENDPOINT}/rpc/create_file?select=id,owner_id,parent_id,path`,
		{
			method: 'POST',
			body: JSON.stringify({
				name: upload.name,
				parent_id: data.get('parent_id')
			}),
			headers: {
				'Content-Type': 'application/json',
				Prefer: 'return=representation'
			}
		}
	);
	if (response.status !== 200) {
		const data = await response.json();
		if (data.message.includes('duplicate key value')) {
			return error(400, 'Duplicate file name');
		}

		console.error(data.message);
		return error(500, 'Could not create upload, contact your administrator.');
	}

	const inodes = await response.json();
	const inode = inodes[0];

	// Stream the file to S3 backend
	const url = sign(`users/${inode.owner_id}${inode.path}/original`, cookies, 'PUT');
	const storage_response = await fetch(url, {
		method: 'PUT',
		body: upload.stream(),
		// @ts-ignore
		duplex: 'half',
		headers: {
			'Content-Type': upload.type,
			'Content-Length': upload.size.toString()
		}
	});
	if (storage_response.status !== 200) {
		console.error(await storage_response.text());
		return error(500, 'Error streaming response to storage backend, contact your administrator.');
	}

	// Mark upload as succesful
	const patch_response = await fetch(`${env.API_ENDPOINT}/files?inode_id=eq.${inode.id}`, {
		method: 'PATCH',
		body: JSON.stringify({ is_uploaded: true }),
		headers: { 'Content-Type': 'application/json' }
	});
	if (patch_response.status !== 204) {
		console.error(await patch_response.text());
		return error(500, 'Error marking inode as uploaded, contact your administrator.');
	}

	return json({ success: true });
}
