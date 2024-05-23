
<script>
    import Page from '$lib/Page.svelte';
    import File from './File.svelte';
    import Uploader from './Uploader.svelte';
    import Upload from './Upload.svelte';
    import { uploads } from './stores.ts';

    export let data;

    const PARALLEL_UPLOADS = 3;

    $: active = $uploads.slice(0, PARALLEL_UPLOADS);
    $: pending = $uploads.slice(PARALLEL_UPLOADS);
</script>

<Page>
    <Uploader />

    {#each active as upload (upload.id) }
        <Upload file={upload.file} />
    {/each}

    {#if pending.length > 0}
        <p>{pending.length} pending</p>
    {/if}

    {#each data.files as file (file.id)}
        <File {...file} />
    {/each}
</Page>

