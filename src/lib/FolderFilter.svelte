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
	let is_opened = false;
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

<input type="hidden" name="folders" value={JSON.stringify(selected)} />

<input bind:value={query} on:focus={open} on:blur={close} />

<ul class="options" class:is-opened={is_opened}>
	{#each folders as folder}
		<FolderFilterFolder {...folder} />
	{/each}
</ul>

<style>
	.options {
		background: var(--color-white);
		color: var(--text-color-dark);
		padding: 0;
		list-style-type: none;
		min-width: 50rem;
		max-width: 50rem;
		max-height: 20rem;
		overflow: scroll;
	}

	.options.is-opened {
		display: block;
	}
</style>
