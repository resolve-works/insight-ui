
<script lang=ts>
    import { enhance } from '$app/forms';
    import Icon from '$lib/Icon.svelte';
    import Actions from '$lib/Actions.svelte';
    import Actionable from './Actionable.svelte';
    import Buttongroup from '$lib/Buttongroup.svelte';

    export let id: string;
    export let name: string;
    export let number_of_pages: number | undefined;
    export let documents: { id: string, name: string, is_ready: boolean }[] = []

    function icon(amount: number) {
        switch(amount) {
            case 0: 
                return 'gg-loadbar';
            case 1:
                return 'gg-file-document';
            default:
                return 'gg-box';
        }
    }

    $: path = documents.length == 1 ? `/documents/${documents[0].id}` : `/uploads/${id}`


    // If number_of_pages is not set, file is being analyzed still
    $: is_ready = number_of_pages !== undefined && documents.every(document => document.is_ready);
</script>

<Actionable {name} {path} icon={icon(documents.length)}>
    <Actions slot="actions">
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
    </Actions>

    {#if documents.length > 1}
        <p>{documents.length} embedded document{documents.length == 1 ? '' : 's'}</p>
    {/if}
</Actionable>
