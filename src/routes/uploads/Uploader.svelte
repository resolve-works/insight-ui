
<script lang=ts>
    import Icon from '$lib/Icon.svelte';
    import { invalidate } from '$app/navigation';
    import { enhance } from '$app/forms';
    import { onMount } from 'svelte';
    import { uploads } from './stores.ts';
    import { Upload } from './Upload.svelte';
    import Section from '$lib/Section.svelte';
    import UploadComponent from './Upload.svelte';
    import PendingUpload from './PendingUpload.svelte';

    const PARALLEL_UPLOADS = 3;

    let is_dragover = false;
    let form: HTMLFormElement;
    let input: HTMLInputElement;
    let button: HTMLButtonElement;
    let submit_button: HTMLButtonElement;

    function drop(e: DragEvent) {
        is_dragover = false;
    
        if( ! e.dataTransfer) {
            return
        }

        input.files = e.dataTransfer.files;
        input.dispatchEvent(new Event('change'));
    }

    // Add files to the uploads store to show nice progress objects to user
    function submit({ formData, cancel }: { formData: FormData, cancel: Function }) {
        const files = formData.getAll('files') as File[]
        uploads.update(uploads => {
            return [ ...uploads, ...files.map(file => new Upload(file)) ]
        })
        cancel()
        return {}
    }

    // Progressively enhance form to have drag & drop uploader with progress
    onMount(() => {
        button.classList.add('uploader')
        input.classList.add('hidden')
        submit_button.classList.add('hidden')
    })


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

    $: started = $uploads.filter(upload => upload.is_started)
    $: pending = $uploads.filter(upload => ! upload.is_started)
</script>

<Section>
    <form method="POST" action="?/upload" enctype="multipart/form-data" bind:this={form} use:enhance={submit}>
        <input name="files" type="file" accept=".pdf" multiple bind:this={input} on:change={() => form.requestSubmit()} />
        <button 
            class="hidden" 
            bind:this={button} 
            on:click|preventDefault={() => input.click()} 
            on:drop|preventDefault={drop}
            on:dragover|preventDefault
            on:dragenter|preventDefault={() => is_dragover = true}
            on:dragexit|preventDefault={() => is_dragover = false}
            class:dragover={is_dragover}
            >
            <span>
                <Icon class="gg-software-upload" />
            </span>

            <h2><b>Choose PDF files</b> or drop them here</h2>
        </button>

        <button class="primary" bind:this={submit_button}>
            Upload
        </button>
    </form>
</Section>

{#if started.length > 0}
    <Section>
        <h3>Uploading...</h3>
        {#each started as upload (upload.id) }
            <UploadComponent upload={upload} />
        {/each}
    </Section>
{/if}

{#if pending.length > 0}
    <Section>
        <h3>{pending.length} upload{pending.length > 1 ? 's' : ''} pending...</h3>
        {#each pending as upload (upload.id) }
            <PendingUpload upload={upload} />
        {/each}
    </Section>
{/if}

<style>
    :global(.hidden) {
        display: none;
    }

    :global(button.uploader) {
        padding: 3rem 1.5rem;
        border: 3px dashed var(--color-page-border);
        display: grid;
        grid-template-columns: auto auto;
        color: var(--text-color-page);
        align-items: center;
        justify-content: center;
        background: transparent;
        width: 100%;
    }

    form {
        margin-bottom: 1rem;
    }

    :global(button.dragover),
    :global(button:hover) {
        color: var(--color-primary);
        border-color: var(--color-primary);
        cursor: pointer;
    }

    h2 {
        font-weight: normal;
    }

    span {
        margin: 0.5rem 1rem 0 1rem;
    }

    span :global(.gg-software-upload) {
        --ggs: 1.8;
    }
</style>
