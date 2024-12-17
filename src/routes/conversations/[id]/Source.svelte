<script lang="ts">
	import Icon from '$lib/Icon.svelte';
	interface Props {
		index: number;
		from_page: number;
		name: string;
	}

	let { index, from_page, name }: Props = $props();
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
