import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';
import {
	redirect_to_oidc_provider,
	get_tokens,
	refresh_tokens,
	parse_token,
	InvalidAccessTokenError,
	clear_tokens
} from '$lib/auth.ts';

/*
TODO - Either extend the ServerLoadEvent to provide an API wrapper
or use the fetch hook to add some error handling to postgrest API

class InsightClient {
	fetch: typeof global.fetch;

	constructor(fetch: typeof global.fetch) {
		this.fetch = fetch;
	}
}

// Extend the ServerLoadEvent type
declare module '@sveltejs/kit' {
	interface ServerLoadEvent {
		api: InsightClient;
	}
}
*/

export async function handle({ event, resolve }) {
	// Did the authentication platform just redirect to us with a new code?
	// TODO - add querystring to redirect_uri
	const redirect_uri = event.url.origin + event.url.pathname;
	const code = event.url.searchParams.get('code');
	if (code) {
		try {
			await get_tokens(event.cookies, redirect_uri, code);
		} catch (e) {
			console.error(e);
			console.log('Could not get tokens from authorization-code, redirecting to auth provider');
			throw redirect_to_oidc_provider(redirect_uri);
		}

		// redirect to clear URL of params
		event.url.searchParams.delete('code');
		event.url.searchParams.delete('session_state');
		event.url.searchParams.delete('iss');
		console.log(`Stored tokens, redirecting to ${event.url}`);
		throw redirect(307, event.url);
	}

	// If we don't have a token, go get them
	const access_token = event.cookies.get('access_token');
	const refresh_token = event.cookies.get('refresh_token');
	if (!refresh_token || !access_token) {
		console.log('Could not get tokens from cookie, redirecting to auth provider');
		throw redirect_to_oidc_provider(redirect_uri);
	}

	// So we do have tokens, Add user info & resolve event
	try {
		const { sub } = parse_token(access_token);
		event.locals = { ...event.locals, sub };
	} catch (err) {
		if (err instanceof InvalidAccessTokenError) {
			clear_tokens(event.cookies);
			throw redirect_to_oidc_provider(redirect_uri);
		}
	}

	return resolve(event);
}

export async function handleFetch({ event, request, fetch }) {
	// Handle API / search API auth
	if (request.url.startsWith(env.API_ENDPOINT) || request.url.startsWith(env.OPENSEARCH_ENDPOINT)) {
		// Add token as bearer auth
		request.headers.set('Authorization', 'Bearer ' + event.cookies.get('access_token'));
		const response = await fetch(request.clone());

		// Unauthorized? Try to refresh the tokens & retry request
		if (response.status == 401) {
			try {
				await refresh_tokens(event.cookies);
			} catch (e) {
				const redirect_uri = event.url.origin + event.url.pathname;
				throw redirect_to_oidc_provider(redirect_uri);
			}
			request.headers.set('Authorization', 'Bearer ' + event.cookies.get('access_token'));
			return fetch(request);
		}

		return response;
	}

	return fetch(request);
}
