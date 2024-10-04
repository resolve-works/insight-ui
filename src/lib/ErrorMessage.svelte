<script lang="ts">
	import Icon from './Icon.svelte';
	export let message: string;
</script>

<p data-testid="error-message"><Icon class="gg-danger error" /> {message}</p>

<style>
	p {
		color: var(--color-error);
		display: flex;
		gap: 0.5rem;
	}
</style>
