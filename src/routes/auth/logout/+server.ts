
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { clear_tokens } from '$lib/auth'

export async function POST(event) {
    clear_tokens(event.cookies)

    const url = new URL(env.OIDC_ENDPOINT)
    url.pathname += '/logout'

    return redirect(302, url)
}
