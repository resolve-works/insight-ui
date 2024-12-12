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
	import Icon from './Icon.svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { onMount, createEventDispatcher } from 'svelte';
	import FolderFilterFolder from './FolderFilterFolder.svelte';
	import { parse_folders } from './search';
	import { writable } from 'svelte/store';

	const dispatch = createEventDispatcher();

	let selected = writable(parse_folders($page.url.searchParams.get('folders')));
	selected.subscribe(() => {
		dispatch('change');
	});

	let folder_container: HTMLDivElement;
	let query = '';
	let is_loading = false;
	let is_opened = false;
	let is_focussed = false;
	let folders: Folder[] = [];
	let focussed_index = 0;

	// Sort tree by doc_count
	function sort(inodes: Inode[]) {
		inodes.sort((a: Inode, b: Inode) => b.doc_count - a.doc_count);
		inodes.forEach((Inode) => sort(Inode.children));
		return inodes;
	}

	async function fetch_folders(query: string) {
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

	function select(index: number) {
		const index_key = folders[index].key;

		if ($selected.find((key) => key == index_key)) {
			$selected = $selected.filter((key) => key != index_key);
		} else {
			$selected = [...$selected, index_key];
		}
	}

	function focus(index: number) {
		if (index >= 0 && index < folders.length) {
			focussed_index = index;

			const element = folder_container.children[index];
			const element_rect = element.getBoundingClientRect();
			const parent_rect = folder_container.getBoundingClientRect();

			if (element_rect.bottom > parent_rect.bottom || element_rect.top < parent_rect.top) {
				element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
			}
		}
	}

	function keydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowUp':
				event.preventDefault();
				focus(focussed_index - 1);
				break;
			case 'ArrowDown':
				event.preventDefault();
				focus(focussed_index + 1);
				break;
			case 'Enter':
				event.preventDefault();
				select(focussed_index);
				break;
		}
	}

	function close(e: MouseEvent) {
		if (e.target == null) {
			return;
		}

		is_opened = false;
	}

	onMount(() => {
		document.addEventListener('click', close);
		return () => {
			document.removeEventListener('click', close);
		};
	});

	$: {
		if (browser) {
			(async () => {
				is_loading = true;
				const unsorted_folders = await fetch_folders(query);
				folders = flatten_inode_tree(sort(unsorted_folders));
				focussed_index = 0;
				is_loading = false;
			})();
		}
	}
</script>

<input type="hidden" name="folders" value={JSON.stringify($selected)} />

<ul>
	{#each $selected as key}
		<li>{key}</li>
	{/each}
</ul>

<input
	placeholder="Type folder name ..."
	class:is-opened={is_opened}
	type="text"
	bind:value={query}
	on:focus={() => {
		is_opened = true;
		is_focussed = true;
	}}
	on:blur={() => (is_focussed = false)}
	on:click|stopPropagation
	on:keydown={keydown}
/>

<div class="holder">
	<div
		class="folders"
		class:is-opened={is_opened}
		class:is-focussed={is_focussed}
		bind:this={folder_container}
	>
		{#if is_loading}
			<p>
				<Icon class="gg-loadbar" /> Loading ...
			</p>
		{:else if !folders.length}
			<p class="empty">No results</p>
		{:else}
			{#each folders as folder, index}
				<FolderFilterFolder
					{...folder}
					is_selected={$selected.includes(folder.key)}
					is_focussed={index == focussed_index}
					on:mouseenter={() => (focussed_index = index)}
					on:click={async () => select(index)}
					on:mousedown
				/>
			{/each}
		{/if}
	</div>
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
		color: var(--text-color-dark);
		list-style-type: none;
		width: 40rem;
		max-height: 20rem;
		border-bottom-left-radius: var(--input-border-radius);
		border-bottom-right-radius: var(--input-border-radius);
		border-top-right-radius: var(--input-border-radius);
		border: var(--input-border);
		background: var(--input-background-color);
		overflow-y: auto;
		z-index: 1;
	}

	.folders.is-opened {
		display: block;
	}

	.folders.is-focussed {
		border-color: var(--input-focus-border-color);
	}

	.folders p {
		display: flex;
		gap: 0.5rem;
		margin: 0;
		padding: 0.5rem 1rem;
	}

	.empty {
		color: var(--text-color-page);
	}
</style>
