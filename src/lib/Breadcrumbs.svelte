<script lang="ts" module>
	export type Breadcrumb = {
		name: string | undefined;
		path: string;
	};
</script>

<script lang="ts">
	import Unnamed from './Unnamed.svelte';

	type Props = {
		breadcrumbs?: Breadcrumb[];
	};

	const { breadcrumbs = [] }: Props = $props();
</script>

<ul>
	<li><a href="/">Home</a></li>

	{#each breadcrumbs as crumb}
		<li>
			<a href={crumb.path}>
				{#if crumb.name}
					{crumb.name}
				{:else}
					<Unnamed />
				{/if}
			</a>
		</li>
	{/each}
</ul>

<style>
	ul {
		margin: 0;
		padding: 1.5rem 0;
		list-style-type: none;
		display: flex;
	}

	li {
		margin-right: 1rem;
		max-width: 16rem;
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow-x: hidden;
	}

	li:after {
		margin-left: 1rem;
		content: '›';
	}

	li:last-child a {
		text-decoration: none;
		color: var(--text-color-dark);
	}

	li:last-child:after {
		content: '';
	}
</style>
