<script lang="ts">
	import Card from '$lib/Card.svelte';
	import Icon from '$lib/Icon.svelte';
	import Unnamed from '$lib/Unnamed.svelte';

	export let name: string | undefined;
	export let path: string;
	export let icon: string;
	export let test_id: string | undefined = undefined;
</script>

<Card data-testid={test_id}>
	<header>
		<h3 data-testid={test_id ? `${test_id}-title` : undefined}>
			<a data-testid={test_id ? `${test_id}-link` : undefined} class="unstyled" href={path}>
				<Icon class={icon} />

				{#if name}
					{name}
				{:else}
					<Unnamed />
				{/if}
			</a>
		</h3>

		<slot name="actions" />
	</header>

	<slot />
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
		display: flex;
		gap: 1rem;
		align-items: center;
	}
</style>
