<script lang="ts">
	interface Props {
		header?: import('svelte').Snippet;
		children?: import('svelte').Snippet;
	}

	let { header, children }: Props = $props();
</script>

<div class="background"></div>

<aside>
	<header>
		{@render header?.()}
	</header>

	{@render children?.()}
</aside>

<style>
	.background {
		background: var(--color-subnavigation);
		box-shadow: var(--box-shadow);
		min-height: 100vh;
		grid-column: 2 / 3;
		grid-row: 1 / 2;
	}

	aside {
		padding: 0 var(--padding-x);
		color: var(--text-color-light);
		min-height: 100vh;
		display: grid;
		grid-template-rows: var(--header-height) 1fr var(--footer-height);
		align-self: start;
		position: sticky;
		top: 0;
		z-index: 2;
		grid-column: 2 / 3;
		grid-row: 1 / 2;
	}

	header {
		display: flex;
		align-items: center;
	}
</style>
