
import {env} from '$env/dynamic/private'
import type {RequestEvent} from '@sveltejs/kit';
import {sign} from '$lib/storage';
import {Channel} from '$lib/amqp.js';
import {schema} from '$lib/validation/inode';
import {validate, ValidationError} from '$lib/validation';
import {fail} from '@sveltejs/kit';

export async function create_folder({request, fetch, cookies}: RequestEvent) {
    try {
        const data = await validate(request, schema)

        const response = await fetch(`${env.API_ENDPOINT}/inodes`, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
            }
        })
        if (response.status != 201) {
            const details = await response.json();
            if (details.code == "23505") {
                return fail(400, {name: "Path must be unique"})
            }

            throw new Error(`Error creating folder: "${details.message}"`)
        }

        const inodes = await response.json();
        const inode = inodes[0]

        const channel = await Channel.connect(cookies)
        channel.publish('index_inode', {id: inode.id});
        await channel.close()
    } catch (err) {
        if (err instanceof ValidationError) {
            return fail(400, err.format())
        }
        throw err
    }
}

// TODO - This does not really fit into form actions with the XHR uploaders.
// Maybe have seperate logic for those. For now, HTTP 500 means "error"
export async function upload({request, fetch, cookies}: RequestEvent) {
    const data = await request.formData();
    const upload: File = data.get('file') as File

    // First create a file model to check if we can upload this file
    const response = await fetch(`${env.API_ENDPOINT}/rpc/create_file?select=id,owner_id,parent_id,path`, {
        method: 'POST',
        body: JSON.stringify({
            name: upload.name,
            parent_id: data.get('parent_id'),
        }),
        headers: {
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
        }
    })
    if (response.status !== 200) {
        const data = await response.json()
        if (data.message.includes('duplicate key value')) {
            throw new Error('Duplicate file')
        }
        throw new Error(data.message)
    }

    const inodes = await response.json()
    const inode = inodes[0]

    // Stream the file to S3 backend
    const url = sign(`users/${inode.owner_id}${inode.path}/original`, cookies, 'PUT')
    const storage_response = await fetch(url, {
        method: 'PUT',
        body: upload.stream(),
        // @ts-ignore
        duplex: 'half',
        headers: {
            'Content-Type': upload.type,
            'Content-Length': upload.size.toString(),
        }
    })
    if (storage_response.status !== 200) {
        throw new Error(`Error streaming response to storage backend: "${await storage_response.text()}"`)
    }

    // Mark upload as succesful
    const patch_response = await fetch(`${env.API_ENDPOINT}/files?inode_id=eq.${inode.id}`, {
        method: 'PATCH',
        body: JSON.stringify({is_uploaded: true}),
        headers: {'Content-Type': 'application/json', }
    })
    if (patch_response.status !== 204) {
        throw new Error(`Error marking inode as uploaded: "${await patch_response.text()}"`)
    }

    const channel = await Channel.connect(cookies)
    channel.publish('ingest_file', {id: inode.id});
    await channel.close()
}

export async function remove({request, fetch, cookies}: RequestEvent) {
    const data = await request.formData();
    const id = data.get('id');

    if (!id) {
        throw new Error('missing "id" in form data');
    }

    await fetch(`${env.API_ENDPOINT}/inodes?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({is_deleted: true}),
        headers: {'Content-Type': 'application/json'}
    })

    const channel = await Channel.connect(cookies)
    channel.publish('delete_inode', {id});
    await channel.close()
}


