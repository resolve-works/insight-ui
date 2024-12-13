<script lang="ts">
	import Actionable from '$lib/Actionable.svelte';
	import FolderTag from '$lib/FolderTag.svelte';

	export let id;
	export let prompts: { query: string }[];
	export let inodes: { path: string }[];
	export let created_at;

	$: parsed_created_at = new Date(created_at).toLocaleString('en-US', { hour12: false });
	$: name = prompts.length ? prompts[0].query : undefined;
</script>

<Actionable {name} path={`/conversations/${id}`} icon="gg-comment">
	<time slot="actions">{parsed_created_at}</time>

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
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		flex-wrap: wrap;
	}
</style>
