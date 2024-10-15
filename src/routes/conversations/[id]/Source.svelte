<script lang="ts">
	import Icon from '$lib/Icon.svelte';
	export let id: number;
	export let index: number;
	export let from_page: number;
	export let name: string;
	export let url: string = `/files/${id}?page=${index - from_page + 1}`;
</script>

<a href={url}>
	<span>
		<Icon class="gg-file" />

		{index - from_page + 1}
	</span>
	{name}
</a>

<style>
	a {
		display: grid;
		align-items: center;
		grid-template-columns: 4rem auto;
		gap: 0.5rem;
	}

	span {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
</style>
