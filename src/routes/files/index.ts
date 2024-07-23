
import {env} from '$env/dynamic/private'
import type {RequestEvent} from '@sveltejs/kit';
import {fail} from '@sveltejs/kit';
import {sign} from '$lib/sign';
import {Channel} from '$lib/amqp.js';
import {schema} from '$lib/validation/inode';
import {validate, ValidationError} from '$lib/validation';

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

export async function upload({request, fetch, cookies}: RequestEvent) {
    const data = await request.formData();
    const uploads: File[] = data.getAll('files') as File[]

    // Filter for 0 size files as submitting empty file input results in single 0 size file?
    for (const upload of uploads.filter(file => file.size > 0)) {
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
            throw new Error(`Error creating file: "${await response.text()}"`)
        }
        const inodes = await response.json()
        const inode = inodes[0]

        // Stream the file to S3 backend
        const url = sign(`users/${inode.owner_id}/${inode.path}/original`, cookies, 'PUT')
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

        const patch_response = await fetch(`${env.API_ENDPOINT}/files?inode_id=eq.${inode.id}`, {
            method: 'PATCH',
            body: JSON.stringify({is_uploaded: true}),
            headers: {'Content-Type': 'application/json', }
        })
        // TODO error handling

        const channel = await Channel.connect(cookies)
        channel.publish('ingest_file', {id: inode.id});
        await channel.close()
    }
}

export async function remove({request, fetch, cookies}: RequestEvent) {
    const data = await request.formData();

    await fetch(`${env.API_ENDPOINT}/inodes?id=eq.${data.get('id')}`, {
        method: 'PATCH',
        body: JSON.stringify({is_deleted: true}),
        headers: {'Content-Type': 'application/json'}
    })

    const channel = await Channel.connect(cookies)
    channel.publish('delete_inode', {id: `${data.get('id')}`});
    await channel.close()
}


