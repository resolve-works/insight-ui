<script lang="ts">
	export let test_id: string | undefined = undefined;
</script>

<span>
	<i data-testid={test_id} role={$$props.class == 'gg-loadbar' ? 'progressbar' : ''} {...$$props} />
</span>

<style>
	@import './icons.css';

	span {
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
