<script lang="ts">
	import Icon from '$lib/Icon.svelte';
	import { page } from '$app/stores';
	import { createEventDispatcher, tick } from 'svelte';
	const dispatch = createEventDispatcher();

	let value: string = $page.url.searchParams.get('query') ?? '';

	page.subscribe(({ url }) => {
		value = url.searchParams.get('query') ?? '';
	});

	async function reset() {
		value = '';
		await tick();
		dispatch('change');
	}
</script>

<p>Filter contents by query</p>

<div>
	<input name="query" type="text" placeholder="Type search query ..." bind:value on:change />

	{#if value}
		<button type="button" on:click={reset}>
			<Icon class="gg-close" />
		</button>
	{/if}
</div>

<style>
	div {
		display: grid;
		grid-template-columns: auto auto;
		justify-content: space-between;
	}

	input[type='text'] {
		width: 100%;
		grid-column: 1 / 3;
		grid-row: 1 / 2;
	}

	button {
		cursor: pointer;
		color: var(--input-placeholder-color);
		grid-column: 2 / 3;
		grid-row: 1 / 2;
		margin: 0 1rem;
	}

	button:focus,
	button:hover {
		color: var(--text-color-dark);
	}
</style>
