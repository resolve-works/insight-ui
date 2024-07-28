<script lang="ts">
	import MultiSelect from 'svelte-multiselect';
	import File from './File.svelte';
	import Title from '$lib/Title.svelte';
	import Search from '$lib/Search.svelte';
	import Page from '$lib/Page.svelte';
	import SideBar from '$lib/SideBar.svelte';
	import { breadcrumbs } from '$lib/stores';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

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
	<h2 slot="header">Filters</h2>

	<nav>
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
	<Search slot="header" />

	<Title>{data.total} file{data.total == 1 ? '' : 's'} found</Title>

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
