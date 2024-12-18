<script lang="ts">
	import IndexPage from './IndexPage.svelte';

	let { data, form } = $props();

	let { inodes, parent_id, page, first_item, last_item, amount_of_items, amount_of_pages } =
		$derived(data);

	const breadcrumbs = [{ name: 'Files', path: '/files' }];
</script>

<IndexPage
	name="Files"
	{breadcrumbs}
	{inodes}
	{parent_id}
	{page}
	{first_item}
	{last_item}
	{amount_of_items}
	{amount_of_pages}
	{form}
/>
