<script lang="ts">
	import Icon from '$lib/Icon.svelte';
	import Page from '$lib/Page.svelte';
	import Title from '$lib/Title.svelte';
	import Conversation from './Conversation.svelte';
	import Pagination from '$lib/Pagination.svelte';

	export let data;

	const { page, first_item, last_item, amount_of_items, amount_of_pages } = data;
</script>

<Page>
	<Title>
		Conversations

		<form method="POST" action="?/create_conversation" slot="actions">
			<button>
				<Icon class="gg-comment" />
				New Conversation
			</button>
		</form>
	</Title>

	{#each data.conversations as conversation}
		<Conversation {...conversation} />
	{/each}

	<Pagination {page} {first_item} {last_item} {amount_of_items} {amount_of_pages} />
</Page>
