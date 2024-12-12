<script lang="ts">
	import Icon from '$lib/Icon.svelte';
	import { ssp, queryParam } from 'sveltekit-search-params';

	export let pushHistory = true;
	const query = queryParam('query', ssp.string(), { pushHistory });

	let is_focused = false;
	export let action = '';

	function submit(e: SubmitEvent) {
		if (!e.target) {
			throw Error('SubmitEvent target not set');
		}
		const formData = new FormData(e.target as HTMLFormElement);
		$query = formData.get('query');
	}
</script>

<form method="get" {action} on:submit|preventDefault={submit}>
	<input
		name="query"
		type="text"
		placeholder="Type search query ..."
		value={$query}
		on:focus={() => (is_focused = true)}
		on:blur={() => (is_focused = false)}
	/>

	<button class="button" class:focus={is_focused}>
		<Icon class="gg-search" />
	</button>
</form>

<style>
	form {
		display: flex;
	}

	input[type='text'] {
		min-width: 18rem;
		border-right: none;
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
	}

	button {
		padding: 0 1rem;
		color: var(--input-placeholder-color);
		cursor: pointer;
		border-left: none;
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
	}

	button.focus {
		border-color: var(--input-focus-border-color);
	}
</style>
