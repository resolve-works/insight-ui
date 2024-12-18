<script lang="ts">
	import Card from '$lib/Card.svelte';
	import Icon from './Icon.svelte';
	import ErrorMessage from './ErrorMessage.svelte';
	import type { MouseEventHandler } from 'svelte/elements';

	interface Props {
		name: string;
		error: string | undefined;
		discard_upload: MouseEventHandler<HTMLButtonElement>;
		loaded: number;
		total: number;
	}

	let { name, error, discard_upload, loaded, total }: Props = $props();
</script>

<Card>
	<header>
		<h3>{name}</h3>

		{#if error}
			<button onclick={discard_upload}><Icon class="gg-close" /></button>
		{/if}
	</header>

	<progress value={loaded} max={total}></progress>

	{#if error}
		<ErrorMessage message={error} />
	{/if}
</Card>

<style>
	header {
		display: flex;
		justify-content: space-between;
	}

	button {
		padding: 0.75rem;
		border-color: transparent;
		background-color: transparent;
	}

	progress {
		width: 100%;
		accent-color: var(--color-primary);
	}

	button {
		cursor: pointer;
	}
</style>
