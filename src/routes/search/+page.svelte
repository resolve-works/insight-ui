<script lang="ts">
	import Section from '$lib/Section.svelte';
	import File from './File.svelte';
	import Title from '$lib/Title.svelte';
	import Page from '$lib/Page.svelte';
	import SideBar from '$lib/SideBar.svelte';
	import FolderFilter from '$lib/FolderFilter.svelte';
	import QueryFilter from '$lib/QueryFilter.svelte';
	import Pagination from '$lib/Pagination.svelte';
	import Breadcrumbs from '$lib/Breadcrumbs.svelte';

	let { data } = $props();
	let { folders, page, first_item, last_item, amount_of_items, amount_of_pages } = $derived(data);

	let form: HTMLFormElement;

	const breadcrumbs = [{ name: 'Search', path: '/search' }];
</script>

<Page class="with-sidebar-left">
	{#snippet header()}
		<Breadcrumbs {breadcrumbs} />
	{/snippet}
	{#snippet sidebar()}
		<SideBar>
			{#snippet header()}
				<h2>Filters</h2>
			{/snippet}

			<nav>
				<form
					action="/search"
					bind:this={form}
					data-sveltekit-keepfocus
					data-sveltekit-replacestate
				>
					<Section>
						<QueryFilter on:change={() => form.requestSubmit()} />
					</Section>

					<Section>
						<FolderFilter selected={folders} on:change={() => form.requestSubmit()} />
					</Section>
				</form>
			</nav>
		</SideBar>
	{/snippet}

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
