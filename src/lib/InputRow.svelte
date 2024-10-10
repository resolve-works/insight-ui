<script lang="ts">
	import Icon from './Icon.svelte';

	export let icon: string | undefined = undefined;
</script>

<div class="row">
	{#if icon}
		<div class="icon">
			<Icon class={icon} />
		</div>
	{/if}

	<div class="input">
		<slot name="input" />
	</div>

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

	.input {
		flex-grow: 1;
	}

	:global(.input input) {
		width: 100%;
	}
</style>
