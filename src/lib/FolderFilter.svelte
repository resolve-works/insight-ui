<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { createEventDispatcher, tick } from 'svelte';

	let folders = $page.url.searchParams.get('folders');

	let selected = folders ? JSON.parse(folders) : [];
	let query = '';
	let loading = false;
	let options: { key: string; doc_count: number }[];

	const dispatch = createEventDispatcher();

	async function change() {
		await tick();
		dispatch('change');
	}

	async function fetch_folders(query: string) {
		loading = true;
		// perform some fetch/database request here to get list of options matching query
		const response = await fetch(`/search/folders?query=${query}`);
		options = await response.json();
		loading = false;
	}

	$: {
		if (browser) {
			fetch_folders(query);
		}
	}
</script>

<input type="hidden" name="folders" value={JSON.stringify(selected)} />

<input bind:value={query} />

{#each options as option}
	<div class="option" slot="option" let:option>
		<span>{option.key}</span>
		<span>{option.doc_count} file{option.doc_count != 1 ? 's' : ''}</span>
	</div>
{/each}
