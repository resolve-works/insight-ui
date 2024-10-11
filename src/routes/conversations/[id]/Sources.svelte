<script context="module" lang="ts">
	export type Source = {
		id: number;
		name: string;
		index: number;
		from_page: number;
	};
</script>

<script lang="ts">
	import Icon from '$lib/Icon.svelte';
	export let sources: Source[];

	let is_opened = false;
</script>

{#if sources.length}
	{#if is_opened}
		{#each sources as source}
			<a href="/files/{source.id}?page={source.index - source.from_page + 1}">
				<span>
					<Icon class="gg-file" />
					{source.index - source.from_page + 1}
				</span>
				{source.name}
			</a>
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
	a {
		display: grid;
		align-items: center;
		grid-template-columns: 6rem auto;
	}

	span {
		display: grid;
		height: 2rem;
		grid-template-columns: 2rem auto;
		align-items: center;
		margin-right: 1rem;
	}

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
