
<script lang="ts">
    import Icon from '$lib/Icon.svelte';
    import Page from '$lib/Page.svelte';
    import Inode from '$lib/Inode.svelte';
    import UploadComponent from '$lib/Upload.svelte';
    import { Upload } from '$lib/Upload.svelte';
    import Folder from '$lib/Folder.svelte';
    import Title from '$lib/Title.svelte';
    import Section from '$lib/Section.svelte';
    import { uploads } from '$lib/stores.ts';
    import { enhance } from '$app/forms';
    import { page } from '$app/stores';
    import { invalidate } from '$app/navigation';

    export let name
    export let inodes

    const PARALLEL_UPLOADS = 3;

    let is_dragover = false;
    let input: HTMLInputElement;
    let form: HTMLFormElement;

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
        const parent_id = formData.get('parent_id') as string
        uploads.update(uploads => {
            return [ 
                ...uploads, 
                ...files.map(file => new Upload(file, parent_id)) 
            ]
        })
        cancel()
        return {}
    }
</script>

<Page>
    {#if started.length > 0}
        <Section>
            <h3>Uploading...</h3>
            {#each started as upload (upload.id) }
                <UploadComponent upload={upload} />
            {/each}

            {#if pending.length > 0}
                <p>{pending.length} upload{pending.length > 1 ? 's' : ''} pending...</p>
            {/if}
        </Section>
    {/if}


    <form method="POST" action="/uploads?/create_folder" use:enhance>
        <input name="name" />
        <input name="parent_id" type="hidden" value="{ $page.params.id }" />

        <button>Create</button>
    </form>

    <Title>
        {name}

        <div class="buttons" slot="actions">
            <form method="POST" action="?/upload" enctype="multipart/form-data" bind:this={form} use:enhance={submit}>
                <input name="files" type="file" accept=".pdf" multiple bind:this={input} on:change={() => form.requestSubmit()} />
                <input name="parent_id" type="hidden" value="{ $page.params.id }" />
                <button 
                    on:click|preventDefault={() => input.click()} 
                    on:drop|preventDefault={drop}
                    on:dragover|preventDefault
                    on:dragenter|preventDefault={() => is_dragover = true}
                    on:dragexit|preventDefault={() => is_dragover = false}
                    class:dragover={is_dragover}
                    >

                    <Icon class="gg-software-upload" />
                    Upload PDFs
                </button>
            </form>

            <button>
                <Icon class="gg-folder-add" />
                Create Folder
            </button>
        </div>
    </Title>

    {#each inodes as inode (inode.id)}
        <Inode {...inode} />
    {/each}

    {#if ! inodes.length}
        <p>empty</p>
    {/if}
</Page>

<style>
    .buttons {
        display: flex;
        gap: 0.5rem;
    }

    input[name=files] {
        display: none;
    }

    :global(button.dragover) {
        color: var(--color-primary);
        border-color: var(--color-primary);
        cursor: pointer;
    }
</style>

