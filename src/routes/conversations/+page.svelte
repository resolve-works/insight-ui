<script lang="ts">
	import Page from '$lib/Page.svelte';
	import Title from '$lib/Title.svelte';
	import Conversation from './Conversation.svelte';
	import Pagination from '$lib/Pagination.svelte';

	let { data } = $props();

	const { page, first_item, last_item, amount_of_items, amount_of_pages } = data;
</script>

<Page>
	<Title>Conversations</Title>

	{#each data.conversations as conversation}
		<Conversation {...conversation} />
	{/each}

	<Pagination {page} {first_item} {last_item} {amount_of_items} {amount_of_pages} />
</Page>
