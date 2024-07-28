<script lang="ts">
	import { page } from '$app/stores';
	import Icon from '$lib/Icon.svelte';

	$: value = $page.url.searchParams.get('query') || '';
	$: page_index = $page.url.searchParams.get('page');

	let is_focused = false;
	export let action = '';
</script>

<form method="get" {action}>
	{#each $page.url.searchParams.getAll('folder') as folder}
		<input type="hidden" name="folder" value={folder} />
	{/each}

	{#if page_index}
		<input type="hidden" name="page" value={page_index} />
	{/if}

	<input
		name="query"
		type="text"
		placeholder="Type search query ..."
		{value}
		on:focus={() => (is_focused = true)}
		on:blur={() => (is_focused = false)}
	/>

	<button class:focus={is_focused}>
		<Icon class="gg-search" />
	</button>
</form>

<style>
	form {
		display: flex;
	}

	input[type='text'] {
		min-width: 18rem;
		border-right: none;
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
	}

	button {
		padding: 0 1rem;
		color: var(--input-placeholder-color);
		cursor: pointer;
		border-left: none;
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
	}

	button.focus {
		border-color: var(--input-focus-border-color);
	}
</style>
