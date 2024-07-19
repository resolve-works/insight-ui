<script>
	import IndexPage from './IndexPage.svelte';
	import { breadcrumbs } from '$lib/stores';

	export let data;

	$: {
		breadcrumbs.set([{ name: 'Files', path: '/files' }]);
	}
</script>

<IndexPage name="Files" {...data} />
