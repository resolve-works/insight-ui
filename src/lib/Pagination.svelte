<script lang="ts">
	import Icon from './Icon.svelte';
	import { page as page_store } from '$app/stores';
	import { replace_searchparam } from './pagination';

	interface Props {
		first_item: number | undefined;
		last_item: number | undefined;
		amount_of_items: number;
		page: number;
		amount_of_pages: number;
	}

	let {
		first_item,
		last_item,
		amount_of_items,
		page,
		amount_of_pages
	}: Props = $props();

	let previous_page = $derived(page > 1 ? page - 1 : 1);
	let next_page = $derived(page < amount_of_pages ? page + 1 : page);

	let { url } = $derived($page_store);
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
