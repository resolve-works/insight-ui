<script lang="ts">
	import Icon from '$lib/Icon.svelte';
	import Page from '$lib/Page.svelte';
	import Title from '$lib/Title.svelte';
	import Conversation from './Conversation.svelte';
	import Pagination from '$lib/Pagination.svelte';
	import Breadcrumbs from '$lib/Breadcrumbs.svelte';

	let { data } = $props();

	const { page, first_item, last_item, amount_of_items, amount_of_pages } = data;
	const breadcrumbs = [{ name: 'Conversations', path: '/conversations' }];
</script>

{#snippet header()}
	<Breadcrumbs {breadcrumbs} />
{/snippet}

<Page {header}>
	<Title>
		Conversations

		{#snippet actions()}
			<form action="/conversations?/create_conversation" method="POST">
				<input type="hidden" name="folders" value={JSON.stringify([])} />

				<button title="Start conversation" data-testid="start-conversation" class="button">
					<Icon class="gg-comment" />
					Start Conversation
				</button>
			</form>
		{/snippet}
	</Title>

	{#each data.conversations as conversation}
		<Conversation {...conversation} />
	{/each}

	<Pagination {page} {first_item} {last_item} {amount_of_items} {amount_of_pages} />
</Page>
