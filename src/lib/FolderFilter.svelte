<script lang="ts">
	import { tick, onMount } from 'svelte';
	import { ssp, queryParam } from 'sveltekit-search-params';
	import MultiSelect from 'svelte-multiselect';
	import type { ObjectOption } from 'svelte-multiselect';

	type FolderOption = ObjectOption & {
		label: string;
		doc_count: number;
	};

	export let pushHistory = true;
	export let options: FolderOption[] = [];

	const folders = queryParam(
		'folders',
		{
			encode: (selected: FolderOption[]) => {
				// Unset param
				if (selected.length == 0) {
					return undefined;
				}

				return ssp.array().encode(selected.map((option) => option.key));
			},
			decode: (param: string | null) => {
				// No param
				if (!param) {
					return null;
				}
				const keys = ssp.array().decode(param);
				// Nothing selected
				if (!keys) {
					return null;
				}
				return options.filter((option) => keys.includes(option.key));
			},
			// Default is no param set
			defaultValue: undefined
		},
		{ pushHistory }
	);

	let selected: FolderOption[] = $folders ?? [];

	onMount(() => {
		const unsubscribe = folders.subscribe((options) => {
			selected = options ?? [];
		});
		return () => unsubscribe();
	});
</script>

<MultiSelect
	{options}
	placeholder="Select folders ..."
	ulOptionsClass="dropdown"
	bind:selected
	on:change={async () => {
		await tick();
		$folders = selected;
	}}
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
