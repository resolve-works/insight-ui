<script lang="ts">
	import Icon from './Icon.svelte';

	export let label: string;
	export let doc_count: number;
	export let indent = 0;
	export let is_selected = false;
	export let is_focussed = false;

	const padding = indent > 0 ? (indent - 1) * 2 + 1 : indent;
</script>

<button
	type="button"
	style="padding-left: {padding + 1}rem"
	class:is-selected={is_selected}
	class:is-focussed={is_focussed}
	on:mousedown|preventDefault
	on:mouseenter
	on:click|stopPropagation|preventDefault
	title={label}
>
	{#if indent > 0}
		<Icon class="gg-corner-down-right" />
	{/if}
	<span class="name" class:padded={indent > 0}>{label}</span>
	<span>{doc_count} file{doc_count != 1 ? 's' : ''}</span>
</button>

<style>
	button {
		display: flex;
		align-items: center;
		line-height: 1.6rem;
		padding: 0.5rem 1rem;
		width: 100%;
	}

	button.is-selected {
		background: var(--color-secondary);
	}

	button.is-focussed {
		background: var(--color-secondary-lighter);
	}

	button.is-focussed.is-selected {
		background: var(--color-secondary-darker);
	}

	button :global(.icon) {
		position: relative;
		bottom: 0.25rem;
	}

	button span {
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
