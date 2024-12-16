<script lang="ts">
	import Icon from './Icon.svelte';
	import { page as page_store } from '$app/stores';
	import { replace_searchparam } from './pagination';

	export let first_item: number | undefined;
	export let last_item: number | undefined;
	export let amount_of_items: number;
	export let page: number;
	export let amount_of_pages: number;

	$: previous_page = page > 1 ? page - 1 : 1;
	$: next_page = page < amount_of_pages ? page + 1 : page;

	$: ({ url } = $page_store);
</script>

<aside>
	<a href={replace_searchparam(url, 'page', '1')} class="button"
		><Icon class="gg-chevron-double-left" /></a
	>
	<a href={replace_searchparam(url, 'page', previous_page.toString())} class="button"
		><Icon class="gg-chevron-left" /></a
	>

	<p>
		<span>{first_item !== undefined ? first_item + 1 : 0}</span>
		- <span>{last_item !== undefined ? last_item + 1 : 0}</span>
		of
		<span>{amount_of_items}</span>
	</p>

	<a href={replace_searchparam(url, 'page', next_page.toString())} class="button"
		><Icon class="gg-chevron-right" /></a
	>
	<a href={replace_searchparam(url, 'page', amount_of_pages.toString())} class="button"
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
