
<script>
    import IndexPage from './IndexPage.svelte';
    import { breadcrumbs } from '$lib/stores';

    export let data;

    $: { breadcrumbs.set([ { name: 'Uploads', path: '/uploads' }, ]) }
</script>

<IndexPage name="Uploads" {...data} />
