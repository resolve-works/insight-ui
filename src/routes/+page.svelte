<script lang="ts">
	import Breadcrumbs from '$lib/Breadcrumbs.svelte';
	import Page from '$lib/Page.svelte';

	let { data } = $props();
</script>

<Page>
	{#snippet header()}
		<Breadcrumbs />
	{/snippet}

	<h1>Welcome</h1>
	<p>
		Start exploring the <b>{data.amount_of_items}</b> files in this instance
		<a href="/search">through search</a>
		or
		<a href="/conversations">conversations</a>. Or maybe you would like to
		<a href="/files">upload some files</a> yourself first?
	</p>
</Page>
