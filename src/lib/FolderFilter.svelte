<script lang="ts">
	import { ssp, queryParam } from 'sveltekit-search-params';
	import MultiSelect from 'svelte-multiselect';
	import type { ObjectOption } from 'svelte-multiselect';

	type FolderOption = ObjectOption & {
		label: string;
		doc_count: number;
	};

	export let pushHistory = true;
	export let options: FolderOption[] = [];

	const folders = queryParam('folders', ssp.array(), { pushHistory });

	let selected = $folders ? options.filter((option) => $folders.includes(option.key)) : [];
	$: $folders = selected.map((option) => option.key);
</script>

<MultiSelect {options} placeholder="Select folders ..." ulOptionsClass="dropdown" bind:selected>
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
