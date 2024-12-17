<script lang="ts">
	import { run } from 'svelte/legacy';

	import IndexPage from './IndexPage.svelte';
	import { breadcrumbs } from '$lib/stores';

	let { data, form } = $props();

	let { inodes, parent_id, page, first_item, last_item, amount_of_items, amount_of_pages } = $derived(data);

	run(() => {
		breadcrumbs.set([{ name: 'Files', path: '/files' }]);
	});
</script>

<IndexPage
	name="Files"
	{inodes}
	{parent_id}
	{page}
	{first_item}
	{last_item}
	{amount_of_items}
	{amount_of_pages}
	{form}
/>
