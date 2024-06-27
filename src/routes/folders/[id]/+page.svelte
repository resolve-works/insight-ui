
<script>
    import { onMount } from 'svelte';
    import Section from '$lib/Section.svelte';
    import Page from '$lib/Page.svelte';
    import SideBar from '$lib/SideBar.svelte';
    import File from '$lib/File.svelte';
    import Folder from '$lib/Folder.svelte';
    import Uploader from '$lib/Uploader.svelte';
    import Pagination from '$lib/Pagination.svelte';
    import { enhance } from '$app/forms';
    import { breadcrumbs } from '$lib/stores';

    export let data;
    const { first_item, last_item, amount_of_items, page, amount_of_pages } = data;

    $: {
        breadcrumbs.set([
            { name: 'Uploads', path: '/uploads' },
            ...data.parents.map(parent => ({ name: parent.name, path: `/folders/${parent.id}` })),
            { name: data.name, path: `/folders/${data.id}` },
        ])
    }
</script>

<SideBar>
    <h2 slot="header">{data.name}</h2>

    <div>
        <ul>
            {#each data.children as folder (folder.id)}
                <li>
                    <Folder {...folder} />
                </li>
            {/each}
        </ul>
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

    ul {
        list-style-type: none;
        padding-left: 0;
    }
</style>

