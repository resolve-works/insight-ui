
<script>
    import Section from '$lib/Section.svelte';
    import Page from '$lib/Page.svelte';
    import SideBar from '$lib/SideBar.svelte';
    import File from './File.svelte';
    import Uploader from './Uploader.svelte';
    import Pagination from '$lib/Pagination.svelte';

    export let data;
</script>

<SideBar>
    <h2 slot="header">Uploads</h2>
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
