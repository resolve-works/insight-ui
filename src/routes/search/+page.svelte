<script lang="ts">
	import Section from '$lib/Section.svelte';
	import File from './File.svelte';
	import Title from '$lib/Title.svelte';
	import Search from '$lib/Search.svelte';
	import Page from '$lib/Page.svelte';
	import SideBar from '$lib/SideBar.svelte';
	import FolderFilter from '$lib/FolderFilter.svelte';
	import Pagination from '$lib/Pagination.svelte';
	import { breadcrumbs } from '$lib/stores';
	import { page as page_store } from '$app/stores';
	import { parse_array_param } from '$lib/validation';

	export let data;
	// Pagination
	$: ({ page, first_item, last_item, amount_of_items, amount_of_pages } = data);

	let form: HTMLFormElement;

	let selected_folders: string[] = parse_array_param($page_store.url.searchParams.get('folders'));

	page_store.subscribe(({ url }) => {
		selected_folders = parse_array_param(url.searchParams.get('folders'));
	});

	$: {
		breadcrumbs.set([{ name: 'Search', path: '/search' }]);
	}
</script>

<SideBar>
	<h2 slot="header">Filters</h2>

	<nav>
		<form action="/search" bind:this={form} data-sveltekit-keepfocus data-sveltekit-replacestate>
			<Section>
				<FolderFilter selected={selected_folders} on:change={() => form.requestSubmit()} />
			</Section>
		</form>
	</nav>
</SideBar>

<Page class="with-sidebar-left">
	<Search slot="header" />

	<Title>{amount_of_items} file{amount_of_items == 1 ? '' : 's'} found</Title>

	{#each data.files as file}
		<File {...file} />
	{/each}

	<Pagination {page} {first_item} {last_item} {amount_of_items} {amount_of_pages} />
</Page>

<style>
	nav {
		/* https://css-tricks.com/flexbox-truncated-text/ */
		min-width: 0;
	}
</style>
