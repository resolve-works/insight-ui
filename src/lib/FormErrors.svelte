<script lang="ts">
	import ErrorMessage from '$lib/ErrorMessage.svelte';
	interface Props {
		errors: Record<string, any> | undefined;
		key: string;
	}

	let { errors, key }: Props = $props();
</script>

{#if errors && key in errors}
	{#each errors[key]._errors as message}
		<ErrorMessage {message} />
	{/each}
{/if}
