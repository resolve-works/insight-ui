
<script>
    import UploadsPage from '$lib/UploadsPage.svelte';
    import { breadcrumbs } from '$lib/stores';

    export let data;

    $: { breadcrumbs.set([ { name: 'Uploads', path: '/uploads' }, ]) }
</script>

<UploadsPage name="Uploads" {...data} />
