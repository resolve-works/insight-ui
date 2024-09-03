<script lang="ts" context="module">
	export type FolderOption = ObjectOption & {
		label: string;
		doc_count: number;
	};
</script>

<script lang="ts">
	import MultiSelect from 'svelte-multiselect';
	import type { ObjectOption } from 'svelte-multiselect';

	export let options: FolderOption[];
	export let selected: FolderOption[];
</script>

{#each selected as option (option.key)}
	<input type="hidden" name="folder" value={option.key} />
{/each}

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
