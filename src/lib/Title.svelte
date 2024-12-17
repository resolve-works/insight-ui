<script lang="ts">
	interface Props {
		children?: import('svelte').Snippet;
		actions?: import('svelte').Snippet;
	}

	let { children, actions }: Props = $props();
</script>

<header>
	<h2 data-testid="title">
		{@render children?.()}
	</h2>

	{@render actions?.()}
</header>

<style>
	header {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 1rem;
		align-items: center;
	}

	h2 {
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow-x: hidden;
	}
</style>
