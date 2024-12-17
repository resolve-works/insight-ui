<script module lang="ts">
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
	import { run, createBubbler, stopPropagation } from 'svelte/legacy';

	const bubble = createBubbler();
	import Icon from './Icon.svelte';
	import { browser } from '$app/environment';
	import { onMount, createEventDispatcher, tick } from 'svelte';
	import FolderFilterFolder from './FolderFilterFolder.svelte';
	import FolderTag from './FolderTag.svelte';

	const dispatch = createEventDispatcher();

	interface Props {
		selected?: string[];
	}

	let { selected = $bindable([]) }: Props = $props();

	let folder_container: HTMLDivElement = $state();
	let query = $state('');
	let is_loading = $state(false);
	let is_opened = $state(false);
	let folders: Folder[] = $state([]);
	let focussed_index = $state(0);

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

	async function select(key: string) {
		if (selected.find((selected_key) => selected_key == key)) {
			selected = selected.filter((selected_key) => selected_key != key);
		} else {
			selected = [...selected, key].sort();
		}

		await tick();
		dispatch('change');
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
				select(folders[focussed_index].key);
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

	run(() => {
		if (browser) {
			(async () => {
				// Defer showing loader to prevent flashing
				const timeout = setTimeout(() => {
					is_loading = true;
				}, 500);
				const unsorted_folders = await fetch_folders(query);
				clearTimeout(timeout);
				folders = flatten_inode_tree(sort(unsorted_folders));
				focussed_index = 0;
				is_loading = false;
			})();
		}
	});
</script>

{#if selected.length}
	<input type="hidden" name="folders" value={JSON.stringify(selected)} />
{/if}

{#if selected.length}
	<p>Selected folders</p>
{/if}
{#each selected as key (key)}
	<FolderTag path={key} is_removable on:click={() => select(key)} />
{/each}

<p>Filter by folder</p>
<input
	placeholder="Type folder name ..."
	class:is-opened={is_opened}
	type="text"
	bind:value={query}
	onfocus={() => (is_opened = true)}
	onblur={() => (is_opened = false)}
	onclick={stopPropagation(bubble('click'))}
	onkeydown={keydown}
/>

<div class="holder">
	<div class="folders" class:is-opened={is_opened} bind:this={folder_container}>
		{#if is_loading}
			<p>
				<Icon class="gg-loadbar" /> Loading ...
			</p>
		{:else if !folders.length}
			<p class="empty">No results</p>
		{:else}
			{#each folders as folder, index (folder.key)}
				<FolderFilterFolder
					{...folder}
					is_selected={selected.includes(folder.key)}
					is_focussed={index == focussed_index}
					on:mouseenter={() => (focussed_index = index)}
					on:click={async () => select(folder.key)}
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
		max-width: 50vw;
		min-width: 40rem;
		max-height: 20rem;
		border-bottom-left-radius: var(--input-border-radius);
		border-bottom-right-radius: var(--input-border-radius);
		border-top-right-radius: var(--input-border-radius);
		border: var(--input-border);
		border-color: var(--input-focus-border-color);
		background: var(--input-background-color);
		overflow-y: auto;
		z-index: 1;
	}

	.folders.is-opened {
		display: block;
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
