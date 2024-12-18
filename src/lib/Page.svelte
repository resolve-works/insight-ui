<script lang="ts">
	interface Props {
		header?: import('svelte').Snippet;
		sidebar?: import('svelte').Snippet;
		children?: import('svelte').Snippet;
		[key: string]: any;
	}

	let { header, children, sidebar }: Props = $props();
</script>

{@render sidebar?.()}

<article class:with-sidebar-left={sidebar != undefined}>
	<header>
		{@render header?.()}
	</header>

	<main>
		{@render children?.()}
	</main>

	<footer>
		<p>Thank you for using Insight.</p>
		<p>
			Do you want to <a href="https://www.discourse.org/">ask for help</a> or
			<a href="https://github.com/resolve-works/insight/issues">report a problem</a>?
		</p>
	</footer>
</article>

<style>
	article {
		position: relative;
		display: grid;
		grid-template-rows: var(--header-height) 1fr var(--footer-height);
		grid-column: 2 / 5;
		padding: 0 calc(var(--padding-x) * 1.5);
		background: var(--color-page);
		box-shadow: var(--box-shadow);
	}

	article.with-sidebar-left {
		grid-column-start: 3;
	}

	article.with-sidebar-right {
		grid-column-end: 4;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	footer {
		display: grid;
		align-items: center;
		color: var(--text-color-page);
		grid-template-columns: auto auto;
		justify-content: space-between;
	}
</style>
