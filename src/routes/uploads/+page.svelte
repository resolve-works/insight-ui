
<script>
    import { invalidate } from '$app/navigation';
    import Page from '$lib/Page.svelte';
    import File from './File.svelte';
    import Uploader from './Uploader.svelte';
    import Upload from './Upload.svelte';
    import Pagination from '$lib/Pagination.svelte';
    import { uploads } from './stores.ts';

    export let data;

    const PARALLEL_UPLOADS = 3;

    $: pending = $uploads.filter(upload => ! upload.is_started).length

    $: {
        for(const upload of $uploads.slice(0, PARALLEL_UPLOADS)) {
            // Start active uploads that have not been started yet.
            if( ! upload.is_started) {
                // Remove uploads from store on completion
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

    {#each $uploads.filter(upload => upload.is_started) as upload (upload.id) }
        <Upload upload={upload} />
    {/each}

    {#if pending > 0}
        <p>{pending} pending</p>
    {/if}

    {#each data.files as file (file.id)}
        <File {...file} />
    {/each}

    <Pagination {...data} />
</Page>

