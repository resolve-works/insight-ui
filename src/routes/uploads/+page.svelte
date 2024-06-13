
<script>
    import Section from '$lib/Section.svelte';
    import Page from '$lib/Page.svelte';
    import File from './File.svelte';
    import Uploader from './Uploader.svelte';
    import Pagination from '$lib/Pagination.svelte';

    export let data;
</script>

<Page>
    <Uploader />

    <Section>
        <h3>Previously uploaded files</h3>
        {#each data.files as file (file.id)}
            <File {...file} />
        {/each}

        <Pagination {...data} />
    </Section>
</Page>
