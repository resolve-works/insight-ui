<script lang="ts">
	import Icon from './Icon.svelte';

	export let icon: string | undefined = undefined;
</script>

<div class="form">
	{#if icon}
		<span class="icon">
			<Icon class={icon} />
		</span>
	{/if}

	<div class="inputs">
		<slot />
	</div>
</div>

<style>
	.icon {
		margin: var(--input-padding-y) 0;
	}

	.form {
		display: flex;
		align-items: start;
		gap: 1rem;
		margin: 0.5rem 0;
	}

	.inputs {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	:global(.inputs .button),
	:global(.inputs button) {
		align-self: end;
	}
</style>
