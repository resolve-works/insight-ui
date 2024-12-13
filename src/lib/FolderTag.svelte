<script lang="ts">
	import Icon from './Icon.svelte';
	export let is_removable = false;
	export let key: string;

	let parts = key.split('/').filter(Boolean);
</script>

<div class="tag">
	{#each parts as part, index}
		<span class="part">{part}</span>
		{#if index < parts.length - 1}
			<span class="slash">/</span>
		{/if}
	{/each}

	{#if is_removable}
		<button on:click>
			<Icon class="gg-close" />
		</button>
	{/if}
</div>

<style>
	.tag {
		display: inline-flex;
		justify-content: space-between;
		max-width: 100%;
		align-items: center;

		margin-bottom: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--color-secondary);
		color: var(--text-color-dark);
		border-radius: var(--input-border-radius);
	}

	.part {
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow-x: hidden;
	}

	button,
	.slash {
		color: var(--color-secondary-darkest);
	}

	button {
		cursor: pointer;
	}

	button:hover {
		color: var(--text-color-dark);
	}
</style>
