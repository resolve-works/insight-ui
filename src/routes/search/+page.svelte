<script lang="ts">
	import Section from '$lib/Section.svelte';
	import File from './File.svelte';
	import Title from '$lib/Title.svelte';
	import Search from '$lib/Search.svelte';
	import Page from '$lib/Page.svelte';
	import SideBar from '$lib/SideBar.svelte';
	import FolderFilter from '$lib/FolderFilter.svelte';
	import { breadcrumbs } from '$lib/stores';
	import { page } from '$app/stores';
	import { parse_folders } from '$lib/search';

	export let data;

	let form: HTMLFormElement;

	let selected_folders: string[] = parse_folders($page.url.searchParams.get('folders'));

	page.subscribe(({ url }) => {
		selected_folders = parse_folders(url.searchParams.get('folders'));
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

	<Title>{data.total} file{data.total == 1 ? '' : 's'} found</Title>

	{#each data.files as file}
		<File {...file} />
	{/each}
</Page>

<style>
	nav {
		/* https://css-tricks.com/flexbox-truncated-text/ */
		min-width: 0;
	}
</style>
