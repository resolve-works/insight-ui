
import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';
import type { HandleFetch } from '@sveltejs/kit';
import { 
    redirect_to_oidc_provider, 
    get_tokens,
    refresh_tokens,
    parse_token 
} from '$lib/auth.ts';

export async function handle({ event, resolve }) {
    // Did the authentication platform just redirect to us with a new code?
    const redirect_uri = event.url.origin + event.url.pathname;
    const code = event.url.searchParams.get('code')
    if(code) {
        try {
            await get_tokens(event.cookies, redirect_uri, code)
        } catch(e) {
            console.error(e)
            throw redirect_to_oidc_provider(redirect_uri);
        }

        // redirect to clear URL of params
        event.url.searchParams.delete('code');
        event.url.searchParams.delete('session_state');
        event.url.searchParams.delete('iss');
        throw redirect(307, event.url)
    }

    // If we don't have a token, go get them
    const access_token = event.cookies.get('access_token');
    const refresh_token = event.cookies.get('refresh_token');
    if( ! refresh_token || ! access_token) {
        throw redirect_to_oidc_provider(redirect_uri)
    }

    // So we do have tokens, Add user info & resolve event
    const { sub } = parse_token(access_token)
    event.locals = { ...event.locals, sub }
    return resolve(event)
}

export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
    // Handle API / search API auth
    if(request.url.startsWith(env.API_ENDPOINT) || request.url.startsWith(env.OPENSEARCH_ENDPOINT)) {
        // Add token as bearer auth
        request.headers.set('Authorization', 'Bearer ' + event.cookies.get('access_token'))
        const response = await fetch(request.clone());

        // Unauthorized? Try to refresh the tokens
        if(response.status == 401) {
            try {
                await refresh_tokens(event.cookies)
            } catch(e) {
                const redirect_uri = event.url.origin + event.url.pathname;
                throw redirect_to_oidc_provider(redirect_uri)
            }
            request.headers.set('Authorization', 'Bearer ' + event.cookies.get('access_token'))
            return fetch(request)
        }

        return response
    }

	return fetch(request);
};
