
import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';
import { XMLParser } from 'fast-xml-parser';
import type { Cookies } from '@sveltejs/kit';

type TokenReponse = { access_token: string, refresh_token: string }

/**
 * Redirect user to OIDC provider, requesting redirect back to us
 */
export function redirect_to_oidc_provider(redirect_uri: string) {
    // No code or previous token, redirect to login
    const url = new URL(env.OIDC_ENDPOINT + '/auth')
    url.searchParams.set('scope', 'profile email')
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('client_id', env.OIDC_CLIENT_ID)
    url.searchParams.set('redirect_uri', redirect_uri)

    return redirect(307, url)
}

/**
 * Parse token payload to extract user info
 */
export function parse_token(token: string) {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload_data = JSON.parse(atob(payload))
    return { sub: payload_data.sub }
}

/**
 * Get temporary storage credentials from the storage backend in exchange for our OIDC token
 */
export async function get_storage_tokens(access_token: string) {
    const url = new URL(env.STORAGE_IDENTITY_ENDPOINT)
    const { sub } = parse_token(access_token)
    url.searchParams.set("Action", "AssumeRoleWithWebIdentity")
    url.searchParams.set("Version", "2011-06-15")
    url.searchParams.set("DurationSeconds", "3600")
    url.searchParams.set('RoleSessionName', sub)
    url.searchParams.set("WebIdentityToken", access_token)
    // Minio does not require this, AWS does
    if(env.STORAGE_IDENTITY_ROLE) {
        url.searchParams.set('RoleArn', env.STORAGE_IDENTITY_ROLE)
    }
    const response = await fetch(url, { method: 'post' })

    const parser = new XMLParser();
    const body = parser.parse(await response.text());
    const { AccessKeyId: access_key_id, SecretAccessKey: secret_access_key, SessionToken: session_token } 
        = body.AssumeRoleWithWebIdentityResponse.AssumeRoleWithWebIdentityResult.Credentials;

    return { access_key_id, secret_access_key, session_token }
}

/**
 * Store tokens, getting new storage tokens while we're at it
 * TODO - don't fetch storage tokens here, handle storage token getting errors
 */
export async function store_tokens(cookies: Cookies, { access_token, refresh_token }: TokenReponse) {
    const storage_tokens = await get_storage_tokens(access_token)
    const tokens = { access_token, refresh_token, ...storage_tokens }
    for(const [key, value] of Object.entries(tokens)) {
        cookies.set(key, value, { path: '/' })
    }
}

/**
 * Clear tokens from cookie
 */
export function clear_tokens(cookies: Cookies) {
    for(const key of ['access_token', 'refresh_token', 'access_key_id', 'secret_access_key', 'session_token']) {
        cookies.delete(key, { path: '/' })
    }
}

/**
 * Request new tokens from OIDC provider with provider supplied auth code
 */
export async function authorization_code_request(redirect_uri: string, code: string) {
    // Code granted, get tokens
    const data = { 
        grant_type: 'authorization_code',
        redirect_uri,
        client_id: env.OIDC_CLIENT_ID,
        code, 
    }

    const response = await fetch(env.OIDC_ENDPOINT + '/token', {
        method: 'post',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data).toString(),
    })

    if(response.status !== 200) {
        throw new Error('Invalid authorization_code')
    }

    return response.json()
}

/**
 * Request tokens with authorization_code supplied by OIDC provider
 */
export async function get_tokens(cookies: Cookies, redirect_uri: string, code: string) {
    const tokens = await authorization_code_request(redirect_uri, code)
    await store_tokens(cookies, tokens)
}

/**
 * Request new tokens from OIDC provider with refresh token
 */
export async function refresh_token_request(refresh_token: string) {
    const data = { 
        grant_type: 'refresh_token', 
        client_id: env.OIDC_CLIENT_ID, 
        refresh_token, 
        scope: 'profile email', 
    }

    const response = await fetch(env.OIDC_ENDPOINT + '/token', {
        method: 'post',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data).toString(),
    })

    if(response.status !== 200) {
        throw new Error('Invalid refresh_token')
    }

    return response.json();
}

/**
 * Refresh tokens with refresh_token from cookie
 */
export async function refresh_tokens(cookies: Cookies) {
    const refresh_token = cookies.get('refresh_token');
    if( refresh_token === undefined ) {
        throw new Error("No refresh_token")
    }
    
    try {
        const tokens = await refresh_token_request(refresh_token)
        await store_tokens(cookies, tokens)
    } catch(err) {
        // Could be that the refresh token was revoked
        clear_tokens(cookies)
        throw err
    }
}
