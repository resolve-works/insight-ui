<script lang="ts">
	import type { Folder } from './FolderFilter.svelte';
	import Icon from './Icon.svelte';

	export let key: string;
	export let doc_count: number;
	export let children: Folder[];

	export let indent = 0;
</script>

<li style="padding-left: {indent}rem">
	{#if indent > 0}
		<Icon class="gg-corner-down-right" />
	{/if}
	<span class="name">{key}</span>
	<span>{doc_count} file{doc_count != 1 ? 's' : ''}</span>
</li>

{#each children as child}
	<svelte:self {...child} indent={indent + 2} />
{/each}

<style>
	li {
		display: flex;
		align-items: center;
	}

	li span {
		padding-top: 0.5rem;
		white-space: nowrap;
	}

	.name {
		flex-grow: 1;
		text-overflow: ellipsis;
		overflow-x: hidden;
		padding-left: 0.5rem;
	}
</style>
