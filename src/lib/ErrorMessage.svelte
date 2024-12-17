<script lang="ts">
	import Icon from './Icon.svelte';
	interface Props {
		message: string;
	}

	let { message }: Props = $props();
</script>

<p data-testid="error-message"><Icon class="gg-danger error" /> {message}</p>

<style>
	p {
		color: var(--color-error);
		display: flex;
		gap: 0.5rem;
	}
</style>
