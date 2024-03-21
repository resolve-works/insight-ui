
<script>
    import Icon from '$lib/Icon.svelte';
    import Page from '$lib/Page.svelte';
    import PDFViewer from '$lib/PDFViewer.svelte';
    import { page } from '$app/stores';
    export let data;
</script>

<Page>
    <header>
        <h2>
            {data.name}
        </h2>

        <a class="button" href={`/documents/${data.id}/edit`}>
            <Icon class="gg-pen" />
            Edit
        </a>

        <a class="button" href={`/uploads/${data.file_id}`}>
            <Icon class="gg-copy" />
            Split
        </a>
    </header>

    <PDFViewer url={data.url} index={parseInt($page.url.searchParams.get('page') ?? '1')} />
</Page>

<style>
    header {
        display: grid;
        gap: 0.5rem;
        grid-template-columns: 1fr auto auto;
        align-items: center;
    }
</style>
