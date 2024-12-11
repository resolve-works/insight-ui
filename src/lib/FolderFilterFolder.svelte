<script lang="ts">
	import type { Folder } from './FolderFilter.svelte';

	export let key: string;
	export let doc_count: number;
	export let children: Folder[];

	export let indent = 0;
</script>

<li style="padding-left: {indent}rem">
	<span>{key}</span>
	<span>{doc_count} file{doc_count != 1 ? 's' : ''}</span>
</li>

{#each children as child}
	<svelte:self {...child} indent={indent + 2} />
{/each}

<style>
	li {
		display: flex;
		justify-content: space-between;
	}

	li span {
		white-space: nowrap;
	}

	li span:first-child {
		text-overflow: ellipsis;
		overflow-x: hidden;
	}
</style>
