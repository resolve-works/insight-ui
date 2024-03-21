
<script>
    import Icon from '$lib/Icon.svelte';
    import Page from '$lib/Page.svelte';
    import PDFViewer from '$lib/PDFViewer.svelte';
    import { page } from '$app/stores';
    export let data;
</script>

<Page>
    <section>
        <header>
            <h2>
                {data.name}
            </h2>

            <a class="button" href={`/uploads/${data.file_id}`}>
                <Icon class="gg-copy" />
                Split document
            </a>
        </header>
    </section>

    <section>
        <PDFViewer url={data.url} index={parseInt($page.url.searchParams.get('page') ?? '1')} />
    </section>
</Page>

<style>
    header {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
    }
</style>
