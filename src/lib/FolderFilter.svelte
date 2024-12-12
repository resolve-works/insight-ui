<script context="module" lang="ts">
	export type Option = { key: string; doc_count: number };

	export type Inode = Option & {
		label: string;
		children: Inode[];
	};

	export type Folder = Option & {
		label: string;
		indent: number;
	};
</script>

<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { createEventDispatcher, tick } from 'svelte';
	import FolderFilterFolder from './FolderFilterFolder.svelte';
	import { parse_folders } from './search';

	let selected = parse_folders($page.url.searchParams.get('folders'));
	let query = '';
	let loading = false;
	let is_opened = true;
	let folders: Folder[] = [];
	let focussed_index = 0;

	const dispatch = createEventDispatcher();

	async function change() {
		await tick();
		dispatch('change');
	}

	// Sort tree by doc_count
	function sort(inodes: Inode[]) {
		inodes.sort((a: Inode, b: Inode) => b.doc_count - a.doc_count);
		inodes.forEach((Inode) => sort(Inode.children));
		return inodes;
	}

	async function fetch_folders(query: string) {
		// perform some fetch/database request here to get list of options matching query
		const response = await fetch(`/search/folders?query=${query}`);
		const options = await response.json();

		// Build a tree from the paths
		return options.reduce((inodes: Inode[], option: Option) => {
			const levels = option.key.split('/').filter(Boolean);
			let target = inodes;

			levels.forEach((label, index) => {
				const is_leaf = index == levels.length - 1;
				if (!is_leaf) {
					target = target.find((child) => child.label == label)!.children;
				} else {
					target.push({ ...option, label, children: [] });
				}
			});

			return inodes;
		}, []);
	}

	function flatten_inode_tree(inodes: Inode[], indent = 0): Folder[] {
		return inodes
			.map((inode) => {
				const { label, key, doc_count } = inode;
				return [
					{ label, key, indent, doc_count },
					...flatten_inode_tree(inode.children, indent + 1)
				];
			})
			.flat();
	}

	function keydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowUp':
				event.preventDefault();
				focussed_index -= 1;
				break;
			case 'ArrowDown':
				event.preventDefault();
				focussed_index += 1;
				break;
			case 'Enter':
				event.preventDefault();
				selected = [...selected, folders[focussed_index].key];
		}
	}

	$: {
		if (browser) {
			(async () => {
				loading = true;
				const unsorted_folders = await fetch_folders(query);
				folders = flatten_inode_tree(sort(unsorted_folders));
				focussed_index = 0;
				loading = false;
			})();
		}
	}
</script>

<input type="hidden" name="folders" value={JSON.stringify(selected)} />

<input
	class:is-opened={is_opened}
	type="text"
	bind:value={query}
	on:focus={() => (is_opened = true)}
	on:blur={() => (is_opened = false)}
	on:keydown={keydown}
/>

<div class="holder">
	<ul class:is-opened={is_opened} class="folders">
		{#each folders as folder, index}
			<FolderFilterFolder
				{...folder}
				is_selected={index == focussed_index}
				on:focus={() => (focussed_index = index)}
			/>
		{/each}
	</ul>
</div>

<style>
	input[type='text'] {
		position: relative;
		width: 100%;
	}

	input[type='text'].is-opened {
		border-bottom-color: var(--input-background-color);
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
		z-index: 2;
	}

	.holder {
		position: relative;
	}

	.folders {
		position: absolute;
		top: calc(var(--input-border-size) * -1);
		display: none;
		margin: 0;
		color: var(--text-color-dark);
		padding: 0;
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

	.folders.is-opened {
		display: block;
	}
</style>
