<script lang="ts">
	import Icon from '$lib/Icon.svelte';
	import Actionable from './Actionable.svelte';
	import { enhance } from '$app/forms';
	import Buttongroup from './Buttongroup.svelte';
	import InputGroup from './InputGroup.svelte';

	export let id: string;
	export let parent_id: string | undefined;
	export let name: string;
	export let type: string;
	export let is_indexed;
	export let is_ready: boolean;
	export let is_owned: boolean;
	export let error: string | undefined;
	export let users: { name: string };

	let icon = type == 'file' ? 'gg-file-document' : 'gg-folder';
</script>

<Actionable {icon} {name} path={`/files/${id}`} test_id="inode">
	<InputGroup slot="actions">
		{#if error}
			<Icon test_id="inode-error" class="gg-danger error" title={error} />
		{:else if (type == 'file' && !is_ready) || (type == 'folder' && !is_indexed)}
			<Icon test_id="inode-loader" class="gg-loadbar" />
		{/if}

		{#if !is_owned && !parent_id}
			<span>Shared by {users.name}</span>
		{:else}
			<Buttongroup test_id="inode-actions">
				<a class="button" href={`/files/${id}/edit`} data-testid="edit-inode">
					<Icon class="gg-pen" />
					Edit
				</a>

				<form method="POST" action="?/remove" use:enhance>
					<input type="hidden" name="id" value={id} />
					<button class="button" data-testid="delete-inode"><Icon class="gg-trash" /> Delete</button
					>
				</form>
			</Buttongroup>
		{/if}
	</InputGroup>
</Actionable>

<style>
	span {
		margin-right: 1rem;
		color: var(--text-color-dark-lighter);
	}
</style>
