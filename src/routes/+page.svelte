<script>
	import Page from '$lib/Page.svelte';
	import { breadcrumbs } from '$lib/stores';

	export let data;

	breadcrumbs.set([]);
</script>

<Page>
	<h1>Welcome</h1>
	<p>
		Start exploring the <b>{data.amount_of_items}</b> files in this instance
		<a href="/search">through search</a>
		or
		<a href="/conversations">conversations</a>. Or maybe you would like to
		<a href="/files">upload some files</a> yourself first?
	</p>
</Page>
