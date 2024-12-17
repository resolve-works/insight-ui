<script lang="ts" context="module">
	export type Breadcrumb = {
		name: string;
		path: string;
	};
</script>

<script lang="ts">
	import { breadcrumbs } from './stores';
	import Unnamed from './Unnamed.svelte';
</script>

<ul>
	<li><a href="/">Home</a></li>

	{#each $breadcrumbs as crumb}
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
