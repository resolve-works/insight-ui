<script lang="ts" context="module">
	export type FolderOption = ObjectOption & {
		label: string;
		doc_count: number;
	};
</script>

<script lang="ts">
	import MultiSelect from 'svelte-multiselect';
	import type { ObjectOption } from 'svelte-multiselect';
	import { browser } from '$app/environment';

	export let selected: FolderOption[] = [];

	let value;
	let searchText = '';
	let loading = false;
	let options: FolderOption[] = [];

	async function fetch_folders(searchText: string) {
		loading = true;
		// perform some fetch/database request here to get list of options matching searchText
		const response = await fetch(`/search/folders?query=${searchText}`);
		options = await response.json();
		console.log(options.length);
		loading = false;
	}

	$: {
		if (browser) {
			fetch_folders(searchText);
		}
	}

	$: selected_paths = selected.map((option) => option.key);
</script>

{#each selected_paths as path}
	<input type="hidden" name="folders[]" value={path} />
{/each}

<pre>value = {JSON.stringify(value)}</pre>

<MultiSelect
	{options}
	placeholder="Select folders ..."
	ulOptionsClass="dropdown"
	bind:value
	bind:selected
	bind:searchText
	on:change
	{loading}
>
	<div class="option" slot="option" let:option>
		<span>{option.label}</span>
		<span>{option.doc_count} file{option.doc_count != 1 ? 's' : ''}</span>
	</div>
	<div class="option" slot="selected" let:option>
		<span>{option.label}</span>
	</div>
</MultiSelect>

<style>
	.option {
		display: flex;
		justify-content: space-between;
	}
</style>
