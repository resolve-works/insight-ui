<script lang="ts">
	import Actionable from '$lib/Actionable.svelte';
	import FolderTag from '$lib/FolderTag.svelte';

	interface Props {
		id: any;
		prompts: { query: string }[];
		inodes: { path: string }[];
		created_at: any;
	}

	let { id, prompts, inodes, created_at }: Props = $props();

	let parsed_created_at = $derived(new Date(created_at).toLocaleString('en-US', { hour12: false }));
	let name = $derived(prompts.length ? prompts[0].query : undefined);
</script>

<Actionable {name} path={`/conversations/${id}`} icon="gg-comment">
	{#snippet actions()}
		<time>{parsed_created_at}</time>
	{/snippet}

	<div>
		{#each inodes as inode}
			<FolderTag path={inode.path} is_width_limited />
		{/each}
	</div>
</Actionable>

<style>
	time {
		color: var(--text-color-dark-lighter);
	}

	div {
		display: flex;
		gap: 0rem 0.5rem;
		margin-bottom: 0.5rem;
		flex-wrap: wrap;
	}
</style>
