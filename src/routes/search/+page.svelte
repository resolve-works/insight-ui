<script lang="ts">
	import Section from '$lib/Section.svelte';
	import File from './File.svelte';
	import Title from '$lib/Title.svelte';
	import Search from '$lib/Search.svelte';
	import Page from '$lib/Page.svelte';
	import SideBar from '$lib/SideBar.svelte';
	import FolderFilter from '$lib/FolderFilter.svelte';
	import { breadcrumbs } from '$lib/stores';

	export let data;

	$: {
		breadcrumbs.set([{ name: 'Search', path: '/search' }]);
	}
</script>

<SideBar>
	<h2 slot="header">Filters</h2>

	<nav>
		<form action="/conversations?/create_conversation" method="POST">
			<Section>
				<p>Filter by folder</p>
				<FolderFilter />
			</Section>

			<button class="secondary" title="Start a conversation with these filters">
				Start Conversation
			</button>
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
