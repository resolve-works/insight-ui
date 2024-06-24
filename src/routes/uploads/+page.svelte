
<script>
    import Section from '$lib/Section.svelte';
    import Page from '$lib/Page.svelte';
    import SideBar from '$lib/SideBar.svelte';
    import File from './File.svelte';
    import Folder from './Folder.svelte';
    import Uploader from './Uploader.svelte';
    import Pagination from '$lib/Pagination.svelte';
    import { enhance } from '$app/forms';

    export let data;
</script>

<SideBar>
    <h2 slot="header">Uploads</h2>

    {#each data.folders as folder (folder.id)}
        <Folder {...folder} />
    {/each}


    <div>
        <form method="POST" action="?/create_folder" use:enhance>
            <input name="name" />

            <button>Create</button>
        </form>
    </div>
</SideBar>

<Page class="with-sidebar-left">
    <Uploader />

    <Section>
        <h3>Previously uploaded files</h3>
        {#each data.files as file (file.id)}
            <File {...file} />
        {/each}

        <Pagination {...data} />
    </Section>
</Page>

<style>
    form {
        display: flex;
        flex-direction: row;
    }
</style>
