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

<Actionable {name} path={`/files/${id}`} {icon}>
	<Actions slot="actions">
		{#if (files && !files.is_ready) || !is_indexed}
			<Icon class="gg-loadbar" />
		{/if}

		<Buttongroup>
			<a class="button" href={`/files/${id}/edit`}>
				<Icon class="gg-pen" />
				Edit
			</a>

			<form method="POST" action="?/remove" use:enhance>
				<input type="hidden" name="id" value={id} />
				<button><Icon class="gg-trash" /> Delete</button>
			</form>
		</Buttongroup>
	</Actions>
</Actionable>
