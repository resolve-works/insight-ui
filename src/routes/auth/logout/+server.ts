
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function POST(event) {
    for(const key of ['access_token', 'refresh_token', 'access_key_id', 'secret_access_key', 'session_token']) {
        event.cookies.delete(key, { path: '/' })
    }

    const url = new URL(env.OIDC_ENDPOINT)
    url.pathname += '/logout'

    return redirect(302, url)
}
