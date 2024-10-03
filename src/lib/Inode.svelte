<script lang="ts">
	import Icon from '$lib/Icon.svelte';
	import Actions from '$lib/Actions.svelte';
	import Actionable from './Actionable.svelte';
	import { enhance } from '$app/forms';
	import Buttongroup from './Buttongroup.svelte';

	export let id: string;
	export let name: string;
	export let type: string;
	export let is_indexed;
	export let files: Record<string, any> | undefined;

	let icon = type == 'file' ? 'gg-file-document' : 'gg-folder';
</script>

<Actionable {name} path={`/files/${id}`} {icon} test_id="inode">
	<Actions slot="actions">
		{#if (files && !files.is_ready) || !is_indexed}
			<Icon class="gg-loadbar" />
		{/if}

		{#if files && files.error}
			<Icon test_id="inode-error" class="gg-danger error" title={files.error} />
		{/if}

		<Buttongroup test_id="inode-actions">
			<a class="button" href={`/files/${id}/edit`} data-testid="edit-inode">
				<Icon class="gg-pen" />
				Edit
			</a>

			<form method="POST" action="?/remove" use:enhance>
				<input type="hidden" name="id" value={id} />
				<button data-testid="delete-inode"><Icon class="gg-trash" /> Delete</button>
			</form>
		</Buttongroup>
	</Actions>
</Actionable>
