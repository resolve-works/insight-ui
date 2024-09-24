<script lang="ts">
	export let errors: Record<string, any> | undefined;
	export let key: string;
</script>

{#if errors && key in errors}
	<ul data-testid={`form-errors-${key}`}>
		{#each errors[key]._errors as message}
			<li>{message}</li>
		{/each}
	</ul>
{/if}

<style>
	ul {
		padding-left: 1rem;
		list-style: none;
	}

	li {
		color: var(--color-error);
	}

	ul li:before {
		content: '!';
		font-weight: bold;
		margin-right: 0.5rem;
	}
</style>
