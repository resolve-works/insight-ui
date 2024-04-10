
<script lang=ts>
    import Icon from '$lib/Icon.svelte';
    import Page from '$lib/Page.svelte';
    import PDFViewer from '$lib/PDFViewer.svelte';
    import { ssp, queryParam } from 'sveltekit-search-params';

    const page = queryParam('page', ssp.number(1), { pushHistory: false });

    export let data;

    function increase() {
        if($page !== null && $page < data.number_of_pages) {
            $page += 1;
        }
    }

    function decrease() {
        if($page !== null && $page > 1) {
            $page -= 1;
        }
    }
</script>

<Page>
    <header>
        <h2>
            {data.name}
        </h2>

        <div class="page">
            <button on:click|preventDefault={decrease}>
                <Icon class="gg-chevron-left" />
            </button>

            <input min="1" max={data.number_of_pages} type="number" bind:value={$page}>

            <button on:click|preventDefault={increase}>
                <Icon class="gg-chevron-right" />
            </button>
        </div>

        <div class="buttons">
            <a class="button" href={`/documents/${data.id}/edit`}>
                <Icon class="gg-pen" />
                Edit
            </a>

            <a class="button" href={`/uploads/${data.file_id}`}>
                <Icon class="gg-copy" />
                Split
            </a>
        </div>
    </header>

    <PDFViewer url={data.url} index={$page} />
</Page>

<style>
    header {
        display: grid;
        gap: 1rem;
        grid-template-columns: 1fr auto auto;
        align-items: center;
    }

    h2 {
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow-x: hidden;
    }

    div {
        display: flex;
        gap: 0.5rem;
    }

    input {
        max-width: 8rem;
    }
</style>
