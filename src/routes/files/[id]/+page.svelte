<script lang="ts">
	import IndexPage from '../IndexPage.svelte';
	import ViewPage from '../ViewPage.svelte';

	let { data, form } = $props();

	const breadcrumbs = [
		{ name: 'Files', path: '/files' },
		...data.ancestors.reverse().map((ancestor: Record<string, string>) => {
			return {
				name: ancestor.name,
				path: `/files/${ancestor.id}`
			};
		}),
		{ name: data.name, path: `/files/${data.id}` }
	];
</script>

{#if data.type == 'file'}
	<ViewPage {breadcrumbs} {...data} />
{:else}
	<IndexPage {...data} {breadcrumbs} {form} />
{/if}
