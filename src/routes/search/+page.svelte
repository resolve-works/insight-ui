<script lang="ts">
	import File from './File.svelte';
	import Title from '$lib/Title.svelte';
	import Search from '$lib/Search.svelte';
	import Page from '$lib/Page.svelte';
	import SideBar from '$lib/SideBar.svelte';
	import FolderFilter from '$lib/FolderFilter.svelte';
	import { breadcrumbs } from '$lib/stores';

	export let data;
	const { options } = data;

	$: {
		breadcrumbs.set([{ name: 'Search', path: '/search' }]);
	}
</script>

<SideBar>
	<h2 slot="header">Filters</h2>

	<nav>
		<p>Filter by folder</p>
		<FolderFilter {options} />
	</nav>
</SideBar>

<Page class="with-sidebar-left">
	<Search slot="header" />

	<Title>{data.total} file{data.total == 1 ? '' : 's'} found</Title>

	{#each data.files as file}
		<File {...file} />
	{/each}
</Page>
