<aside>
	<header>
		<slot name="header" />
	</header>

	<slot />
</aside>

<style>
	aside {
		padding: 0 var(--padding-x);
		background: var(--color-subnavigation);
		color: var(--text-color-light);
		box-shadow: var(--box-shadow);
		display: grid;
		grid-template-rows: subgrid;
		grid-column: 2 / 3;
		grid-row: 1 / 4;
		position: sticky;
		top: 0;
		min-height: 100vh;
	}

	header {
		display: grid;
		align-items: center;
	}

	aside :global() {
		--input-border-color: var(--color-primary-darker);
		--sms-border: var(--input-border-size) solid var(--input-border-color);
	}

	aside :global(button),
	aside :global(.button) {
		display: block;
		width: 100%;
	}
</style>
