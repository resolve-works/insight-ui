
<script lang="ts">
    import Icon from '$lib/Icon.svelte';
    import Page from '$lib/Page.svelte';
    import File from '$lib/File.svelte';
    import Folder from '$lib/Folder.svelte';
    import Title from '$lib/Title.svelte';
    import Uploader from '$lib/Uploader.svelte';
    import { enhance } from '$app/forms';

    export let name
    export let folders
    export let files
</script>

<Page>
    <!--<Uploader />-->

    <!--<form method="POST" action="?/create_folder" use:enhance>-->
        <!--<input name="name" />-->

        <!--<button>Create</button>-->
    <!--</form>-->

    <Title>
        {name}

        <div class="buttons" slot="actions">
            <button>
                <Icon class="gg-software-upload" />
                Upload PDFs
            </button>

            <button>
                <Icon class="gg-folder-add" />
                Create Folder
            </button>
        </div>
    </Title>

    {#each folders as folder (folder.id)}
        <Folder {...folder} />
    {/each}

    {#each files as file (file.id)}
        <File {...file} />
    {/each}

    {#if ! folders.length && ! files.length}
        <p>empty</p>
    {/if}
</Page>

<style>
    .buttons {
        display: flex;
        gap: 0.5rem;
    }
</style>

