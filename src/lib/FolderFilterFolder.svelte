<script lang="ts">
	import type { Folder } from './FolderFilter.svelte';
	import Icon from './Icon.svelte';

	export let key: string;
	export let doc_count: number;
	export let children: Folder[];

	export let indent = 0;
	const padding = indent > 0 ? (indent - 1) * 2 + 1 : indent;
</script>

<li style="padding-left: {padding}rem">
	{#if indent > 0}
		<Icon class="gg-corner-down-right" />
	{/if}
	<span class="name" class:padded={indent > 0}>{key}</span>
	<span>{doc_count} file{doc_count != 1 ? 's' : ''}</span>
</li>

{#each children as child}
	<svelte:self {...child} indent={indent + 1} />
{/each}

<style>
	li {
		display: flex;
		align-items: center;
		line-height: 1.6rem;
		padding: 0.25rem 0;
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
