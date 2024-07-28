<script>
	import Search from '$lib/Search.svelte';
	import Page from '$lib/Page.svelte';
	import { breadcrumbs } from '$lib/stores';

	breadcrumbs.set([]);
</script>

<Page>
	<h1>Search documents</h1>
	<Search />
</Page>
