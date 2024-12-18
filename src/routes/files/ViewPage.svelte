<script lang="ts">
	import type { Breadcrumb } from '$lib/Breadcrumbs.svelte';
	import Breadcrumbs from '$lib/Breadcrumbs.svelte';
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

	interface Props {
		id: any;
		name: any;
		breadcrumbs: Breadcrumb[];
		url: any;
		from_page: number;
		to_page: number | undefined;
		highlights?: string[] | undefined;
		next_hit_index?: number | undefined;
		previous_hit_index?: number | undefined;
		is_owned: boolean;
		users: { name: string };
		page: number;
		query: string | null;
		folders: string | null;
	}

	let {
		id,
		name,
		breadcrumbs,
		url,
		from_page,
		to_page,
		highlights = undefined,
		next_hit_index = undefined,
		previous_hit_index = undefined,
		is_owned,
		users,
		page = $bindable(),
		query,
		folders
	}: Props = $props();

	let page_form: HTMLFormElement;
	let is_focused = $state(false);
	let number_of_pages = $derived((to_page ?? 0) - from_page);

	async function set_page(index: number) {
		page = index;
		await tick();
		page_form.requestSubmit();
	}

	function increase(e: Event) {
		e.preventDefault();
		if (page < number_of_pages) {
			set_page(page + 1);
		}
	}

	function decrease(e: Event) {
		e.preventDefault();
		if (page > 1) {
			set_page(page - 1);
		}
	}
</script>

{#snippet sidebar()}
	<SideBar>
		{#snippet header()}
			<h2>Filters</h2>
		{/snippet}

		<nav>
			<form data-sveltekit-keepfocus data-sveltekit-replacestate>
				<Section>
					<QueryFilter />

					{#if $page_store.url.searchParams.has('page')}
						<input type="hidden" name="page" value={page} />
					{/if}
				</Section>
			</form>

			{#if previous_hit_index != undefined || next_hit_index != undefined}
				<div class="hit-navigation">
					{#if previous_hit_index != undefined}
						<a
							class="button previous"
							href={replace_searchparam(
								$page_store.url,
								'page',
								(previous_hit_index + 1).toString()
							)}
							data-sveltekit-replacestate
						>
							<Icon class="gg-chevron-left" />
							Previous Hit
						</a>
					{/if}
					{#if next_hit_index != undefined}
						<a
							class="button next"
							href={replace_searchparam($page_store.url, 'page', (next_hit_index + 1).toString())}
							data-sveltekit-replacestate
						>
							Next Hit

							<Icon class="gg-chevron-right" />
						</a>
					{/if}
				</div>
			{/if}
		</nav>
	</SideBar>
{/snippet}

{#snippet header()}
	<Breadcrumbs {breadcrumbs} />
{/snippet}

<Page {header} {sidebar}>
	<Title>
		{name}

		{#snippet actions()}
			<InputGroup>
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
					<button class="button" type="button" onclick={decrease} class:focus={is_focused}>
						<Icon class="gg-chevron-left" />
					</button>

					{#if $page_store.url.searchParams.has('folders')}
						<input type="hidden" name="folders" value={JSON.stringify(folders)} />
					{/if}
					{#if $page_store.url.searchParams.has('query')}
						<input type="hidden" name="query" value={query} />
					{/if}

					<input
						min="1"
						max={number_of_pages}
						type="number"
						name="page"
						bind:value={page}
						onfocus={() => (is_focused = true)}
						onblur={() => (is_focused = false)}
						onchange={() => page_form.requestSubmit()}
					/>

					<button class="button" type="button" onclick={increase} class:focus={is_focused}>
						<Icon class="gg-chevron-right" />
					</button>
				</form>
			</InputGroup>
		{/snippet}
	</Title>

	<div class="container">
		<PDFViewer {url} {highlights} page_number={page} />

		<button class="cover-button" onclick={decrease}>
			<Icon class="gg-chevron-left" />
		</button>

		<button class="cover-button" onclick={increase}>
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

	.hit-navigation {
		display: flex;
		gap: 0.5rem;
	}

	.hit-navigation .button {
		flex-basis: 50%;
	}

	.hit-navigation .button.next {
		display: flex;
		justify-content: end;
		margin-left: auto;
	}
</style>
