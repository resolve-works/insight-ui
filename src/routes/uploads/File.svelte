
<script lang=ts>
    import { enhance } from '$app/forms';
    import Card from '$lib/Card.svelte';
    import Icon from '$lib/Icon.svelte';
    import Buttongroup from '$lib/Buttongroup.svelte';

    export let id: string;
    export let name: string;
    export let status: string;
    export let documents: { id: string, name: string, status: string }[] = []

    $: is_idle = ! status && documents.every(document => ! document.status);
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
            {#if ! is_idle}
                <Icon class="gg-loadbar" />
            {/if}

            <Buttongroup>
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

