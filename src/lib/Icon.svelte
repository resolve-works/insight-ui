<!-- @migration-task Error while migrating Svelte code: $$props is used together with named props in a way that cannot be automatically migrated. -->
<script lang="ts">
	export let test_id: string | undefined = undefined;
</script>

<span class="icon">
	<i data-testid={test_id} role={$$props.class == 'gg-loadbar' ? 'progressbar' : ''} {...$$props}
	></i>
</span>

<style>
	@import './icons.css';

	.icon {
		width: 1.35rem;
		height: 1.35rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.error {
		color: var(--color-error);
	}

	.warning {
		color: var(--color-warning);
	}
</style>
