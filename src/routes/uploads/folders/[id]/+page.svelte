
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

    $: parent = data.parents.at(-1)

    $: {
        breadcrumbs.set([
            { name: 'Uploads', path: '/uploads' },
            ...data.parents.map(parent => ({ name: parent.name, path: `/uploads/folders/${parent.id}` })),
            { name: data.name, path: `/folders/${data.id}` },
        ])
    }
</script>

<SideBar>
    <h2 slot="header">{data.name}</h2>

    <div>
        <p>
            {#if parent }
                <Folder name="../" path="/uploads/folders/{parent.id}" icon="chevron-left" />
            {:else}
                <Folder name="../" path="/uploads" icon="chevron-left" />
            {/if}
        </p>

        <Folders folders={data.children} />
    </div>

    <div>
        <form method="POST" action="?/create_folder" use:enhance>
            <input name="name" />

            <button>Create</button>
        </form>
    </div>
</SideBar>

<Page class="with-sidebar-left">
    <!--<Uploader />-->

    <Section>
        <!--<h3>Previously uploaded files</h3>-->
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

