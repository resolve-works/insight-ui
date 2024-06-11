
<script>
    import { invalidate } from '$app/navigation';
    import Page from '$lib/Page.svelte';
    import File from './File.svelte';
    import Uploader from './Uploader.svelte';
    import Upload from './Upload.svelte';
    import { uploads } from './stores.ts';

    export let data;

    const PARALLEL_UPLOADS = 3;

    $: active = $uploads.slice(0, PARALLEL_UPLOADS);
    $: pending = $uploads.slice(PARALLEL_UPLOADS);

    // Start active uploads that have not been started yet. Remove them on completion
    $: {
        for(const upload of active) {
            if( ! upload.is_started) {
                upload.addEventListener('upload_finished', () => {
                    invalidate('api:files')
                    uploads.update(uploads => uploads.filter(u => u != upload))
                })

                upload.start()
            }
        }
    }
</script>

<Page>
    <Uploader />

    {#each active as upload (upload.id) }
        <Upload upload={upload} />
    {/each}

    {#if pending.length > 0}
        <p>{pending.length} pending</p>
    {/if}

    {#each data.files as file (file.id)}
        <File {...file} />
    {/each}
</Page>

