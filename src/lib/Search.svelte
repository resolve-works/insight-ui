<script lang="ts">
	import { page } from '$app/stores';
	import Icon from '$lib/Icon.svelte';
	export let value = '';
</script>

<form method="get" action="/search">
	<input name="query" type="text" placeholder="Search contents by keyword" {value} />

	{#each $page.url.searchParams.getAll('folder') as folder}
		<input type="hidden" name="folder" value={folder} />
	{/each}

	<button>
		<Icon class="gg-search" />
	</button>
</form>

<style>
	form {
		display: grid;
		grid-template-columns: 5fr 3rem;
	}

	input[type='text'] {
		grid-column: 1 / 3;
		grid-row: 1;
	}

	button {
		grid-column: 2 / 3;
		grid-row: 1;
		background: none;
		padding: 0 0.5rem;
		color: var(--text-color-dark);
		border: none;
		cursor: pointer;
	}
</style>
