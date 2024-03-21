
<script lang=ts>
    import { enhance } from '$app/forms';
    import Card from '$lib/Card.svelte';
    import Icon from '$lib/Icon.svelte';

    export let id: string;
    export let name: string;
    export let status: string;
    export let documents: { id: string, name: string, status: string }[] = []

    $: is_idle = ! status && documents.every(document => ! document.status);
</script>

<Card>
    <h3>
        <a class="unstyled" href={`/uploads/${id}`}>
            {name}
        </a>

        {#if ! is_idle}
            <Icon class="gg-loadbar" />
        {:else}
            <form method="POST" action="?/remove" use:enhance>
                <input type="hidden" name="id" value={id} />
                <button class="primary"><Icon class="gg-trash" /> Delete</button>
            </form>
        {/if}
    </h3>

    {#if documents.length > 1}
        <p>{documents.length} embedded document{documents.length == 1 ? '' : 's'}</p>
    {/if}
</Card>

<style>
    h3 {
        display: grid;
        grid-template-columns: auto auto;
        align-items: center;
        justify-content: space-between;
    }

    p {
        display: flex;
        gap: 0.5rem;
    }

    button {
        margin: -1rem;
    }
</style>

