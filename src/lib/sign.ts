
import type {Cookies} from '@sveltejs/kit';
import {env} from '$env/dynamic/private';
import {presignSignatureV4} from 'minio/dist/esm/signing.mjs'

/**
 * Sign a S3 storage path for method. Keep this on the server because of the crypto dependency
 */
export function sign(path: string, cookies: Cookies, method: string = 'GET') {
    let values: Record<string, any> = {}
    for (const key of ['access_key_id', 'secret_access_key', 'session_token']) {
        values[key] = cookies.get(key)
    }
    const {access_key_id, secret_access_key, session_token} = values;
    const url = new URL(env.STORAGE_ENDPOINT)

    const request = {
        protocol: url.protocol,
        port: url.port,
        method,
        path: encodeURI('/' + env.STORAGE_BUCKET + '/' + path),
        headers: {
            host: url.host
        },
    }

    return presignSignatureV4(
        request,
        access_key_id,
        secret_access_key,
        session_token,
        env.STORAGE_REGION,
        new Date(), 60 * 60
    )
}
