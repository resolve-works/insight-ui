<script>
	import IndexPage from './IndexPage.svelte';
	import { breadcrumbs } from '$lib/stores';

	export let data;
	export let form;

	$: ({ inodes, parent_id, page, first_item, last_item, amount_of_items, amount_of_pages } = data);

	$: {
		breadcrumbs.set([{ name: 'Files', path: '/files' }]);
	}
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
