
<script>
    import Section from '$lib/Section.svelte';
    import Page from '$lib/Page.svelte';
    import SideBar from '$lib/SideBar.svelte';
    import File from '$lib/File.svelte';
    import Folder from '$lib/Folder.svelte';
    import Folders from '$lib/Folders.svelte';
    import Uploader from '$lib/Uploader.svelte';
    import Pagination from '$lib/Pagination.svelte';
    import { enhance } from '$app/forms';
    import { breadcrumbs } from '$lib/stores';

    export let data;
    const { first_item, last_item, amount_of_items, page, amount_of_pages } = data;

    $: { breadcrumbs.set([ { name: 'Uploads', path: '/uploads' }, ]) }
</script>

<SideBar>
    <h2 slot="header">Uploads</h2>

    <div>
        <p>
            <Folder name="/" path="/uploads" icon="home" />
        </p>
        
        <Folders folders={data.folders} />
    </div>

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

        <Pagination {first_item} {last_item} {amount_of_items} {page} {amount_of_pages} />
    </Section>
</Page>

<style>
    form {
        display: flex;
        flex-direction: row;
    }
</style>
