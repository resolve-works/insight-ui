<script lang="ts">
	import Icon from './Icon.svelte';

	export let icon: string | undefined = undefined;
</script>

<div class="row">
	{#if icon}
		<span class="icon">
			<Icon class={icon} />
		</span>
	{/if}

	<slot />
</div>

<style>
	.icon {
		margin: var(--input-padding-y) 0;
	}

	.row {
		display: flex;
		align-items: start;
		gap: 1rem;
		margin: 0.5rem 0;
	}

	.row :global(div) {
		flex-grow: 1;
	}

	.row :global(div input) {
		width: 100%;
	}
</style>
