<script lang="ts">
	import Search from '$lib/Search.svelte';
	import InputGroup from '$lib/InputGroup.svelte';
	import Icon from '$lib/Icon.svelte';
	import Page from '$lib/Page.svelte';
	import Title from '$lib/Title.svelte';
	import PDFViewer from '$lib/PDFViewer.svelte';
	import { ssp, queryParam } from 'sveltekit-search-params';

	const page = queryParam('page', ssp.number(1), { pushHistory: false });

	export let id;
	export let name;
	export let url;
	export let from_page: number;
	export let to_page: number | undefined;
	export let highlights;
	export let is_owned: boolean;
	export let users: { name: string };

	let is_focused = false;

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
	<Search pushHistory={false} slot="header" />

	<Title>
		{name}

		<InputGroup slot="actions">
			{#if !is_owned}
				<span class="shared">Shared by {users.name}</span>
			{/if}

			<a class="button" href={`/files/${id}/edit`}>
				<Icon class="gg-pen" />
				Edit
			</a>

			<div class="page-select">
				<button on:click|preventDefault={decrease} class:focus={is_focused}>
					<Icon class="gg-chevron-left" />
				</button>

				<input
					min="1"
					max={number_of_pages}
					type="number"
					bind:value={$page}
					on:focus={() => (is_focused = true)}
					on:blur={() => (is_focused = false)}
				/>

				<button on:click|preventDefault={increase} class:focus={is_focused}>
					<Icon class="gg-chevron-right" />
				</button>
			</div>
		</InputGroup>
	</Title>

	<div class="container">
		<PDFViewer {url} {highlights} index={$page ?? 1} />

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
		color: var(--text-color-page);
		animation: 3s infinite alternate slidein;
	}
	.cover-button:hover {
		opacity: 1;
	}

	.cover-button:last-child {
		right: 0;
	}

	.page-select {
		display: flex;
	}

	.page-select button:first-child {
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
		border-right: none;
	}

	.page-select button:last-child {
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
		border-left: none;
	}

	/* Chromium way of hiding the spinner */
	.page-select input[type='number']::-webkit-inner-spin-button {
		appearance: none;
	}

	.page-select input[type='number'] {
		/* Mozilla way of hiding the spinner */
		appearance: textfield;
		border-radius: 0;
		border-right: none;
		border-left: none;
	}

	.shared {
		margin-right: 1rem;
		color: var(--text-color-page);
	}

	button.focus {
		border-color: var(--input-focus-border-color);
	}
</style>
