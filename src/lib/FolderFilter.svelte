<script context="module" lang="ts">
	export type Option = { key: string; doc_count: number };

	export type Folder = Option & {
		children: Folder[];
	};
</script>

<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { createEventDispatcher, tick } from 'svelte';
	import FolderFilterFolder from './FolderFilterFolder.svelte';

	let folders_param = $page.url.searchParams.get('folders');

	let selected = folders_param ? JSON.parse(folders_param) : [];
	let query = '';
	let loading = false;
	let is_opened = true;
	let options: Option[] = [];
	let folders: Folder[] = [];

	const dispatch = createEventDispatcher();

	async function change() {
		await tick();
		dispatch('change');
	}

	function sort(folders: Folder[]) {
		folders.sort((a: Folder, b: Folder) => b.doc_count - a.doc_count);
		folders.forEach((folder) => sort(folder.children));
		return folders;
	}

	async function fetch_folders(query: string) {
		loading = true;
		// perform some fetch/database request here to get list of options matching query
		const response = await fetch(`/search/folders?query=${query}`);
		const options = await response.json();

		// Build a tree from the paths
		const unsorted_folders = options.reduce((folders: Folder[], option: Option) => {
			const levels = option.key.split('/').filter(Boolean);
			let target = folders;

			levels.forEach((level, index) => {
				const is_leaf = index == levels.length - 1;
				if (!is_leaf) {
					target = target.find((child) => child.key == level)!.children;
				} else {
					target.push({ ...option, key: level, children: [] });
				}
			});

			return folders;
		}, []);

		// Sort tree by doc_count
		folders = sort(unsorted_folders);

		loading = false;
	}

	function open() {
		is_opened = true;
	}

	function close() {
		is_opened = false;
	}

	$: {
		if (browser) {
			fetch_folders(query);
		}
	}
</script>

<div class:is-opened={is_opened}>
	<input type="hidden" name="folders" value={JSON.stringify(selected)} />

	<input type="text" bind:value={query} on:focus={open} on:blur={close} />

	<ul class="folders">
		{#each folders as folder}
			<FolderFilterFolder {...folder} />
		{/each}
	</ul>
</div>

<style>
	div {
		position: relative;
	}

	input[type='text'] {
		position: relative;
		display: block;
	}

	.is-opened input[type='text'] {
		border-bottom-color: var(--input-background-color);
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
		z-index: 2;
	}

	.folders {
		position: relative;
		top: calc(var(--input-border-size) * -1);
		display: none;
		margin: 0;
		color: var(--text-color-dark);
		padding: 0.5rem 1rem;
		list-style-type: none;
		max-width: 40rem;
		max-height: 20rem;
		border-bottom-left-radius: var(--input-border-radius);
		border-bottom-right-radius: var(--input-border-radius);
		border-top-right-radius: var(--input-border-radius);
		border: var(--input-border-size) solid var(--input-focus-border-color);
		background: var(--input-background-color);
		overflow: scroll;
		z-index: 1;
	}

	.is-opened .folders {
		display: block;
	}
</style>
