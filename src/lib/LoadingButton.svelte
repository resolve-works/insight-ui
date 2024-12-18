<script lang="ts">
	import Icon from './Icon.svelte';

	interface Props {
		is_loading: boolean;
		label: string;
		test_id: string | undefined;
	}

	const { is_loading, label, test_id }: Props = $props();
</script>

<button disabled={is_loading} class="button primary prompt-button" data-testid={test_id}>
	{#if is_loading}
		<span><Icon class="gg-loadbar" /></span>
	{/if}
	<span class:invisible={is_loading}>{label}</span>
</button>

<style>
	button {
		display: grid;
	}

	button span {
		grid-column: 1 / 2;
		grid-row: 1 / 2;
		margin: 0 auto;
	}

	button .invisible {
		visibility: hidden;
	}
</style>
