<script lang="ts">
	import ErrorMessage from '$lib/ErrorMessage.svelte';
	export let errors: Record<string, any> | undefined;
	export let key: string;
</script>

{#if errors && key in errors}
	{#each errors[key]._errors as message}
		<ErrorMessage {message} />
	{/each}
{/if}
