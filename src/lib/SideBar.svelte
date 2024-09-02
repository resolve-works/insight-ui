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
		min-height: 100vh;
		display: grid;
		grid-template-rows: var(--header-height) 1fr var(--footer-height);
		align-self: start;
		position: sticky;
		top: 0;
	}

	header {
		display: flex;
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
