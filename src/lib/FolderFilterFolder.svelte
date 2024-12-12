<script lang="ts">
	import Icon from './Icon.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let label: string;
	export let doc_count: number;
	export let indent = 0;
	export let is_selected = false;

	const padding = indent > 0 ? (indent - 1) * 2 + 1 : indent;
</script>

<li
	style="padding-left: {padding + 1}rem"
	class:is_selected
	on:mouseenter={() => dispatch('focus')}
>
	{#if indent > 0}
		<Icon class="gg-corner-down-right" />
	{/if}
	<span class="name" class:padded={indent > 0}>{label}</span>
	<span>{doc_count} file{doc_count != 1 ? 's' : ''}</span>
</li>

<style>
	li {
		display: flex;
		align-items: center;
		line-height: 1.6rem;
		padding: 0.25rem 1rem;
	}

	li.is_selected {
		background: #ff0;
	}

	li :global(.icon) {
		position: relative;
		bottom: 0.3rem;
	}

	li span {
		white-space: nowrap;
	}

	.name {
		flex-grow: 1;
		text-overflow: ellipsis;
		overflow-x: hidden;
		margin-right: 1rem;
	}

	.name.padded {
		padding-left: 0.5rem;
	}
</style>
