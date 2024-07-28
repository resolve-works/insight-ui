<script lang="ts">
	import { page } from '$app/stores';
	import Icon from '$lib/Icon.svelte';

	const value = $page.url.searchParams.get('query') || '';

	let is_focused = false;
</script>

<form method="get" action="/search">
	<input
		name="query"
		type="text"
		placeholder="Search contents by keyword"
		{value}
		on:focus={() => (is_focused = true)}
		on:blur={() => (is_focused = false)}
	/>

	{#each $page.url.searchParams.getAll('folder') as folder}
		<input type="hidden" name="folder" value={folder} />
	{/each}

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
