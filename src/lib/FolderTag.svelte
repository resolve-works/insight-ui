<script lang="ts">
	import { createBubbler } from 'svelte/legacy';

	const bubble = createBubbler();
	import Icon from './Icon.svelte';
	interface Props {
		is_width_limited?: boolean;
		is_removable?: boolean;
		path: string;
	}

	let { is_width_limited = false, is_removable = false, path }: Props = $props();

	let parts = path.split('/').filter(Boolean);
</script>

<div class="tag" class:is-width-limited={is_width_limited}>
	{#each parts as part, index}
		<span class="part">{part}</span>
		{#if index < parts.length - 1}
			<span class="slash">/</span>
		{/if}
	{/each}

	{#if is_removable}
		<button type="button" onclick={bubble('click')}>
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
		font-size: 0.8rem;
	}

	.tag.is-width-limited {
		max-width: 40%;
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

	button:focus,
	button:hover {
		color: var(--text-color-dark);
	}
</style>
