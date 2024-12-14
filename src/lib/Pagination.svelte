<script lang="ts">
	import Icon from './Icon.svelte';
	import { page as page_store } from '$app/stores';

	export let first_item: number | undefined;
	export let last_item: number | undefined;
	export let amount_of_items: number;
	export let page: number;
	export let amount_of_pages: number;

	function url_for_page(url: URL, page: number) {
		url.searchParams.set('page', page.toString());
		return url.toString();
	}

	$: previous_page = page > 1 ? page - 1 : 1;
	$: next_page = page < amount_of_pages ? page + 1 : page;

	$: ({ url } = $page_store);
</script>

<aside>
	<a href={url_for_page(url, 1)} class="button"><Icon class="gg-chevron-double-left" /></a>
	<a href={url_for_page(url, previous_page)} class="button"><Icon class="gg-chevron-left" /></a>

	<p>
		<span>{first_item !== undefined ? first_item + 1 : 0}</span>
		- <span>{last_item !== undefined ? last_item + 1 : 0}</span>
		of
		<span>{amount_of_items}</span>
	</p>

	<a href={url_for_page(url, next_page)} class="button"><Icon class="gg-chevron-right" /></a>
	<a href={url_for_page(url, amount_of_pages)} class="button"
		><Icon class="gg-chevron-double-right" /></a
	>
</aside>

<style>
	aside {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin: 1rem 0;
	}

	span {
		font-weight: bold;
	}

	p {
		margin: 0 1rem;
	}
</style>
