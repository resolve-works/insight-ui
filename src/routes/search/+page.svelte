<script lang="ts">
	import { run } from 'svelte/legacy';

	import Section from '$lib/Section.svelte';
	import File from './File.svelte';
	import Title from '$lib/Title.svelte';
	import Page from '$lib/Page.svelte';
	import SideBar from '$lib/SideBar.svelte';
	import FolderFilter from '$lib/FolderFilter.svelte';
	import QueryFilter from '$lib/QueryFilter.svelte';
	import Pagination from '$lib/Pagination.svelte';
	import { breadcrumbs } from '$lib/stores';

	let { data } = $props();
	let { folders, page, first_item, last_item, amount_of_items, amount_of_pages } = $derived(data);

	let form: HTMLFormElement = $state();

	run(() => {
		breadcrumbs.set([{ name: 'Search', path: '/search' }]);
	});
</script>

<SideBar>
	{#snippet header()}
		<h2>Filters</h2>
	{/snippet}

	<nav>
		<form action="/search" bind:this={form} data-sveltekit-keepfocus data-sveltekit-replacestate>
			<Section>
				<QueryFilter on:change={() => form.requestSubmit()} />
			</Section>

			<Section>
				<FolderFilter selected={folders} on:change={() => form.requestSubmit()} />
			</Section>
		</form>
	</nav>
</SideBar>

<Page class="with-sidebar-left">
	<Title>{amount_of_items} file{amount_of_items == 1 ? '' : 's'} found</Title>

	{#each data.files as file (file.id)}
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
