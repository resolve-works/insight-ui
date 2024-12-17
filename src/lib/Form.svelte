<script lang="ts">
	import Icon from './Icon.svelte';

	interface Props {
		icon?: string | undefined;
		test_id?: string | undefined;
		children?: import('svelte').Snippet;
	}

	let { icon = undefined, test_id = undefined, children }: Props = $props();
</script>

<div class="form" data-testid={test_id}>
	{#if icon}
		<span class="icon">
			<Icon class={icon} />
		</span>
	{/if}

	<div class="inputs">
		{@render children?.()}
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
