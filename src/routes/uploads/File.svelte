
<script lang=ts>
    import { enhance } from '$app/forms';
    import Card from '$lib/Card.svelte';
    import Icon from '$lib/Icon.svelte';
    import Buttongroup from '$lib/Buttongroup.svelte';

    export let id: string;
    export let name: string;
    export let number_of_pages: number | undefined;
    export let documents: { id: string, name: string, status: string }[] = []

    const document_is_ready = (document: Record<string, any>) => {
        return document.is_ingested && document.is_indexed && document.is_embedded
    }

    // If number_of_pages is not set, file is being analyzed still
    $: is_ready = number_of_pages !== undefined && documents.every(document_is_ready);
</script>

<Card>
    <header>
        <h3>
            {#if documents.length == 1 }
                <a class="unstyled" href={`/documents/${documents[0].id}`}>
                    {name}
                </a>
            {:else}
                <a class="unstyled" href={`/uploads/${id}`}>
                    {name}
                </a>
            {/if}
        </h3>

        <div class="actions">
            {#if ! is_ready}
                <Icon class="gg-loadbar" />
            {/if}

            <Buttongroup>
                {#if documents.length == 1 }
                    <a class="button" href={`/documents/${documents[0].id}/edit`}>
                        <Icon class="gg-pen" />
                        Edit
                    </a>

                    <a class="button" href={`/uploads/${id}`}>
                        <Icon class="gg-copy" />
                        Split
                    </a>
                {/if}

                <form method="POST" action="?/remove" use:enhance>
                    <input type="hidden" name="id" value={id} />
                    <button><Icon class="gg-trash" /> Delete</button>
                </form>
            </Buttongroup>
        </div>
    </header>

    {#if documents.length > 1}
        <p>{documents.length} embedded document{documents.length == 1 ? '' : 's'}</p>
    {/if}
</Card>

<style>
    header {
        display: grid;
        grid-template-columns: auto auto;
        align-items: center;
        justify-content: space-between;
    }

    .actions {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    p {
        display: flex;
        gap: 0.5rem;
    }
</style>

