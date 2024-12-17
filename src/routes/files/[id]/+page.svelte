<script lang="ts">
	import { run } from 'svelte/legacy';

	import IndexPage from '../IndexPage.svelte';
	import ViewPage from '../ViewPage.svelte';
	import { breadcrumbs } from '$lib/stores';

	let { data, form } = $props();

	run(() => {
		breadcrumbs.set([
			{ name: 'Files', path: '/files' },
			...data.ancestors.reverse().map((ancestor: Record<string, string>) => {
				return {
					name: ancestor.name,
					path: `/files/${ancestor.id}`
				};
			}),
			{ name: data.name, path: `/files/${data.id}` }
		]);
	});
</script>

{#if data.type == 'file'}
	<ViewPage {...data} />
{:else}
	<IndexPage {...data} {form} />
{/if}
