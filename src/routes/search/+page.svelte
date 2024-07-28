<script lang="ts">
	import MultiSelect from 'svelte-multiselect';
	import File from './File.svelte';
	import Search from '$lib/Search.svelte';
	import Page from '$lib/Page.svelte';
	import SideBar from '$lib/SideBar.svelte';
	import Section from '$lib/Section.svelte';
	import { page } from '$app/stores';
	import { breadcrumbs } from '$lib/stores';
	import { goto } from '$app/navigation';
	const query = $page.url.searchParams.get('query') || '';

	export let data;

	let folder_params = $page.url.searchParams.getAll('folder');
	let selected = data.options.filter((option: Record<string, any>) =>
		folder_params.includes(option.key)
	);

	function change() {
		const url = new URL($page.url);
		url.searchParams.delete('folder');
		for (const option of selected) {
			url.searchParams.append('folder', option.key);
		}
		goto(url);
	}

	$: {
		breadcrumbs.set([{ name: 'Search', path: '/search' }]);
	}
</script>

<SideBar>
	<Search slot="header" value={query} />

	<nav>
		<Section>
			<h2>{data.total} file{data.total == 1 ? '' : 's'} found</h2>
		</Section>

		<p>Filter by folder</p>
		<MultiSelect
			options={data.options}
			placeholder="Select folders ..."
			ulOptionsClass="dropdown"
			bind:selected
			on:change={change}
		>
			<div class="option" slot="option" let:option>
				<span>{option.label}</span>
				<span>{option.doc_count} file{option.doc_count != 1 ? 's' : ''}</span>
			</div>
			<div class="option" slot="selected" let:option>
				<span>{option.label}</span>
			</div>
		</MultiSelect>
	</nav>
</SideBar>

<Page class="with-sidebar-left">
	{#each data.files as file}
		<File {...file} />
	{/each}
</Page>

<style>
	.option {
		display: flex;
		justify-content: space-between;
	}
</style>
