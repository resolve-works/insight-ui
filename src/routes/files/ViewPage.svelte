
<script lang=ts>
    import Icon from '$lib/Icon.svelte';
    import Page from '$lib/Page.svelte';
    import Title from '$lib/Title.svelte';
    import Actions from '$lib/Actions.svelte';
    import PDFViewer from '$lib/PDFViewer.svelte';
    import { ssp, queryParam } from 'sveltekit-search-params';

    const page = queryParam('page', ssp.number(1), { pushHistory: false });

    export let id;
    export let name;
    export let url;
    export let from_page;
    export let to_page;

    $: number_of_pages = (to_page ?? 0) - from_page

    function increase() {
        if($page !== null && $page < number_of_pages) {
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
    <Title>
        {name}

        <Actions slot="actions">
            <div class="page">
                <button on:click|preventDefault={decrease}>
                    <Icon class="gg-chevron-left" />
                </button>

                <input min="1" max={number_of_pages} type="number" bind:value={$page}>

                <button on:click|preventDefault={increase}>
                    <Icon class="gg-chevron-right" />
                </button>
            </div>

            <div class="buttons">
                <a class="button" href={`/files/${id}/edit`}>
                    <Icon class="gg-pen" />
                    Edit
                </a>
            </div>
        </Actions>
    </Title>

    <div class="container">
        <PDFViewer url={url} index={$page ?? 0} />

        <button class="cover-button" on:click|preventDefault={decrease}>
        </button>

        <button class="cover-button" on:click|preventDefault={increase}>
        </button>
    </div>
</Page>

<style>
    .buttons,
    .page {
        display: flex;
        gap: 0.5rem;
    }

    input {
        max-width: 8rem;
    }

    .container {
        position: relative;
    }

    .cover-button {
        position: absolute;
        opacity: 0;
        width: 50%;
        top: 0;
        bottom: 0;
    }
    .cover-button:last-child {
        right: 0;
    }
</style>
