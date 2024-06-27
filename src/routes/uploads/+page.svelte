
<script>
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

    $: { breadcrumbs.set([ { name: 'Uploads', path: '/uploads' }, ]) }
</script>

<SideBar>
    <h2 slot="header">Uploads</h2>

    <div>
        <ul>
            {#each data.folders as folder (folder.id)}
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

        <Pagination {...data} />
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
