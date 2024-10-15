<script context="module" lang="ts">
	export type Source = {
		id: number;
		name: string;
		index: number;
		from_page: number;
	};
</script>

<script lang="ts">
	import SourceComponent from './Source.svelte';

	export let sources: Source[];

	let is_opened = false;
</script>

{#if sources.length}
	{#if is_opened}
		{#each sources as source}
			<SourceComponent {...source} />
		{/each}
	{/if}

	<p>
		<button
			on:click={() => {
				is_opened = !is_opened;
			}}
			title="Pages related to your query are used by the model to generate a response."
		>
			{#if is_opened}Hide{:else}Show{/if}
			{sources.length} linked page{#if sources.length != 1}s{/if}
		</button>
	</p>
{/if}

<style>
	button {
		background: none;
		padding: 0;
		border: none;
		color: var(--text-color-page);
	}

	button:hover {
		color: var(--color-primary);
	}
</style>
