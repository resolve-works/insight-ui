<script lang="ts">
	import Icon from '$lib/Icon.svelte';
	export let index: number;
	export let from_page: number;
	export let name: string;
</script>

<span class="source">
	<span class="icon">
		<Icon class="gg-file" />

		{index - from_page + 1}
	</span>
	{name}
</span>

<style>
	.source {
		display: grid;
		align-items: center;
		grid-template-columns: 4.5rem auto;
		gap: 0.5rem;
	}

	.icon {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
</style>
