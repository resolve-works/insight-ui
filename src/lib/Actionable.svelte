<script lang="ts">
	import Card from '$lib/Card.svelte';
	import Icon from '$lib/Icon.svelte';
	import Unnamed from '$lib/Unnamed.svelte';

	interface Props {
		name: string | undefined;
		path: string;
		icon: string;
		test_id?: string | undefined;
		actions?: import('svelte').Snippet;
		children?: import('svelte').Snippet;
	}

	let {
		name,
		path,
		icon,
		test_id = undefined,
		actions,
		children
	}: Props = $props();
</script>

<Card data-testid={test_id}>
	<header>
		<h3 data-testid={test_id ? `${test_id}-title` : undefined}>
			<a data-testid={test_id ? `${test_id}-link` : undefined} href={path}>
				<Icon class={icon} />

				{#if name}
					{name}
				{:else}
					<Unnamed />
				{/if}
			</a>
		</h3>

		{@render actions?.()}
	</header>

	{@render children?.()}
</Card>

<style>
	header {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 5rem;
		align-items: center;
		justify-content: space-between;
	}

	a {
		text-decoration: none;
		color: var(--text-color-dark);
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	a:hover {
		text-decoration: underline;
		color: var(--color-primary);
	}
</style>
