<script lang="ts">
	import InputGroup from '$lib/InputGroup.svelte';
	import Icon from '$lib/Icon.svelte';
	import Page from '$lib/Page.svelte';
	import Title from '$lib/Title.svelte';
	import QueryFilter from '$lib/QueryFilter.svelte';
	import PDFViewer from '$lib/PDFViewer.svelte';
	import Section from '$lib/Section.svelte';
	import SideBar from '$lib/SideBar.svelte';
	import { replace_searchparam } from '$lib/pagination';
	import { page as page_store } from '$app/stores';
	import { tick } from 'svelte';

	export let id;
	export let name;
	export let url;
	export let from_page: number;
	export let to_page: number | undefined;
	export let highlights;
	export let hit_pages;
	export let is_owned: boolean;
	export let users: { name: string };

	let page_form: HTMLFormElement;

	let is_focused = false;

	$: number_of_pages = (to_page ?? 0) - from_page;

	$: folders_param = $page_store.url.searchParams.get('folders');
	$: query_param = $page_store.url.searchParams.get('query');
	$: page_param = $page_store.url.searchParams.get('page');

	$: ({ url } = $page_store);

	let page: number = parseInt($page_store.url.searchParams.get('page') ?? '1');

	async function set_page(index: number) {
		page = index;
		await tick();
		page_form.requestSubmit();
	}

	function increase() {
		if (page < number_of_pages) {
			set_page(page + 1);
		}
	}

	function decrease() {
		if (page > 1) {
			set_page(page - 1);
		}
	}
</script>

<SideBar>
	<h2 slot="header">Filters</h2>

	<nav>
		<form data-sveltekit-keepfocus data-sveltekit-replacestate>
			<Section>
				<QueryFilter />

				{#if page_param}
					<input type="hidden" name="page" value={page_param} />
				{/if}
			</Section>

			{#if hit_pages.length}
				<Section>
					<p>
						Found on {hit_pages.length} page{#if hit_pages.length != 1}s{/if}
					</p>
					<ul class="hit-pages">
						{#each hit_pages as index}
							<li class:active={index == page}>
								<a href={replace_searchparam(url, 'page', index)}>Page {index}</a>
							</li>
						{/each}
					</ul>
				</Section>
			{/if}
		</form>
	</nav>
</SideBar>

<Page class="with-sidebar-left">
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

			<form
				bind:this={page_form}
				class="page-select"
				data-sveltekit-keepfocus
				data-sveltekit-replacestate
			>
				<button
					class="button"
					type="button"
					on:click|preventDefault={decrease}
					class:focus={is_focused}
				>
					<Icon class="gg-chevron-left" />
				</button>

				{#if folders_param}
					<input type="hidden" name="folders" value={folders_param} />
				{/if}
				{#if query_param}
					<input type="hidden" name="query" value={query_param} />
				{/if}

				<input
					min="1"
					max={number_of_pages}
					type="number"
					name="page"
					bind:value={page}
					on:focus={() => (is_focused = true)}
					on:blur={() => (is_focused = false)}
					on:change={() => page_form.requestSubmit()}
				/>

				<button
					class="button"
					type="button"
					on:click|preventDefault={increase}
					class:focus={is_focused}
				>
					<Icon class="gg-chevron-right" />
				</button>
			</form>
		</InputGroup>
	</Title>

	<div class="container">
		<PDFViewer {url} {highlights} index={page ?? 1} />

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
		display: flex;
		justify-content: center;
		align-items: center;
		position: absolute;
		opacity: 0;
		width: 10rem;
		top: 0;
		bottom: 0;
		color: var(--text-color-page);
		animation: 3s infinite alternate slidein;
		cursor: pointer;
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

	.hit-pages {
		line-height: 1.6rem;
	}

	.hit-pages .active {
		font-weight: bold;
	}

	.hit-pages a {
		color: var(--text-color-white);
	}
</style>
