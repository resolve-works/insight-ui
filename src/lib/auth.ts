
import { env } from '$env/dynamic/private';
import { XMLParser } from 'fast-xml-parser';

export class InvalidRefreshTokenError extends Error {}

export function parse_token(token: string) {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload_data = JSON.parse(atob(payload))
    return { sub: payload_data.sub }
}

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

export async function get_tokens_through_refresh(refresh_token: string) {
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
        throw new InvalidRefreshTokenError()
    }

    return await response.json();
}
