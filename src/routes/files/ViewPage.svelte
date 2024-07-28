<script lang="ts">
	import Search from '$lib/Search.svelte';
	import InputGroup from '$lib/InputGroup.svelte';
	import Icon from '$lib/Icon.svelte';
	import Page from '$lib/Page.svelte';
	import Title from '$lib/Title.svelte';
	import Actions from '$lib/Actions.svelte';
	import PDFViewer from '$lib/PDFViewer.svelte';
	import { ssp, queryParam } from 'sveltekit-search-params';

	const page = queryParam('page', ssp.number(1), { pushHistory: false });

	export let id;
	export let name;
	export let url;
	export let from_page;
	export let to_page;

	$: number_of_pages = (to_page ?? 0) - from_page;

	function increase() {
		if ($page !== null && $page < number_of_pages) {
			$page += 1;
		}
	}

	function decrease() {
		if ($page !== null && $page > 1) {
			$page -= 1;
		}
	}
</script>

<Page>
	<Search slot="header" />

	<Title>
		{name}

		<Actions slot="actions">
			<a class="button" href={`/files/${id}/edit`}>
				<Icon class="gg-pen" />
				Edit
			</a>

			<InputGroup>
				<button on:click|preventDefault={decrease}>
					<Icon class="gg-chevron-left" />
				</button>

				<input min="1" max={number_of_pages} type="number" bind:value={$page} />

				<button on:click|preventDefault={increase}>
					<Icon class="gg-chevron-right" />
				</button>
			</InputGroup>
		</Actions>
	</Title>

	<div class="container">
		<PDFViewer {url} index={$page ?? 0} />

		<button class="cover-button" on:click|preventDefault={decrease}>
			<Icon class="gg-chevron-left" />
		</button>

		<button class="cover-button" on:click|preventDefault={increase}>
			<Icon class="gg-chevron-right" />
		</button>
	</div>
</Page>

<style>
	input {
		max-width: 8rem;
	}

	.container {
		position: relative;
	}

	:global(.cover-button span) {
		--ggs: 4;
	}

	.cover-button {
		border: none;
		background: transparent;
		justify-content: center;
		position: absolute;
		opacity: 0;
		width: 10rem;
		top: 0;
		bottom: 0;
		color: var(--color-page);
		animation: 3s infinite alternate slidein;
	}
	.cover-button:hover {
		opacity: 1;
	}

	.cover-button:last-child {
		right: 0;
	}
</style>
