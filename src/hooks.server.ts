
import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';
import type { RequestEvent, HandleFetch } from '@sveltejs/kit';

import { get_tokens_through_refresh, get_storage_tokens, parse_token, InvalidRefreshTokenError } from '$lib/auth.ts';

function auth_redirect(event: RequestEvent) {
    // No code or previous token, redirect to login
    const url = new URL(env.OIDC_ENDPOINT + '/auth')
    url.searchParams.set('scope', 'profile email')
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('client_id', env.OIDC_CLIENT_ID)
    url.searchParams.set('redirect_uri', event.url.origin + event.url.pathname)

    return redirect(307, url)
}

export async function handle({event, resolve}) {
    // Did the authentication platform just redirect to us with a new code?
    const code = event.url.searchParams.get('code')
    if(code !== null) {
        // Code granted, get tokens
        const data = { 
            grant_type: 'authorization_code',
            redirect_uri: event.url.origin + event.url.pathname,
            client_id: env.OIDC_CLIENT_ID,
            code, 
        }

        const token_response = await fetch(env.OIDC_ENDPOINT + '/token', {
            method: 'post',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(data).toString(),
        })

        if(token_response.status !== 200) {
            throw auth_redirect(event);
        }

        // Succesfully got fresh tokens, get fresh storage tokens also and store it all in cookies
        const { access_token, refresh_token } = await token_response.json()
        const storage_tokens = await get_storage_tokens(access_token)
        const tokens = { access_token, refresh_token, ...storage_tokens }
        for(const [key, value] of Object.entries(tokens)) {
            event.cookies.set(key, value, { path: '/' })
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
    if(refresh_token === undefined || access_token === undefined) {
        throw auth_redirect(event)
    }

    // So we do have tokens, add them to locals
    const { sub } = parse_token(access_token)
    event.locals = { ...event.locals, sub, access_token, refresh_token }

    for(const key of ['access_key_id', 'secret_access_key', 'session_token']) {
        const value = event.cookies.get(key);
        event.locals = { ...event.locals, [key]: value }
    }

    // Resolve event as it has tokens
    return resolve(event)

    // Refresh token
    /*
    try {
        const { access_token, refresh_token } 
            = await get_tokens_through_refresh(event.cookies.get('refresh_token') as string) 
            
        // Parse JWT payload to get claims
        const payload = access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload_data = JSON.parse(atob(payload))
        const sub = payload_data.sub

        const storage_tokens = await get_storage_tokens(access_token, sub)

        event.locals = { 
            access_token,
            ...storage_tokens,
            sub,
        }

        // Refresh token was good, store new response
        event.cookies.set('refresh_token', refresh_token, { path: '/' })

        // Resolve event with new tokens
        return resolve(event)
    } catch(error) {
        if(error instanceof InvalidRefreshTokenError) {
            // Remove stale token and redirect to login
            event.cookies.delete('refresh_token', { path: '/' })
            throw auth_redirect(event)
        } else {
            throw error;
        }
    }
    */

    throw auth_redirect(event)
}

export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
    if(request.url.startsWith(env.API_ENDPOINT)) {
        request.headers.append('Authorization', 'Bearer ' + event.locals.access_token)
    }

	return fetch(request);
};
