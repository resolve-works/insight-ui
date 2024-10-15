<script lang="ts">
	import Actionable from '$lib/Actionable.svelte';

	export let id;
	export let prompts: { query: string }[];
	export let inodes: { path: string }[];
	export let created_at;

	$: parsed_created_at = new Date(created_at).toLocaleString('en-US', { hour12: false });
	$: name = prompts.length ? prompts[0].query : undefined;
</script>

<Actionable {name} path={`/conversations/${id}`} icon="gg-comment">
	<p>
		<time>{parsed_created_at}</time>
		{#each inodes as inode}
			<span class="inode">{inode.path}</span>
		{/each}
	</p>
</Actionable>

<style>
	p {
		margin-top: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	time {
		color: var(--text-color-dark-lighter);
	}

	.inode {
		border-radius: var(--sms-border-radius);
		background: var(--sms-selected-bg);
		color: var(--sms-selected-text-color);
		padding: var(--sms-selected-li-padding);
	}
</style>
