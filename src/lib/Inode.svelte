
<script lang=ts>
    import { enhance } from '$app/forms';
    import Icon from '$lib/Icon.svelte';
    import Actions from '$lib/Actions.svelte';
    import Actionable from './Actionable.svelte';
    import Buttongroup from '$lib/Buttongroup.svelte';

    export let id: string;
    export let name: string;
    export let files: Record<string, any> | undefined;

    const is_ready = false
    const children = [];

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

</script>

<Actionable {name} path={`/uploads/${id}`} icon={icon(children.length)}>
    <Actions slot="actions">
        {#if ! is_ready}
            <Icon class="gg-loadbar" />
        {/if}

        <Buttongroup>
            <a class="button" href={`/uploads/${id}/edit`}>
                <Icon class="gg-pen" />
                Edit
            </a>

            <a class="button" href={`/uploads/${id}/split`}>
                <Icon class="gg-copy" />
                Split
            </a>

            <form method="POST" action="?/remove" use:enhance>
                <input type="hidden" name="id" value={id} />
                <button><Icon class="gg-trash" /> Delete</button>
            </form>
        </Buttongroup>
    </Actions>

    {#if children.length > 1}
        <p>{children.length} embedded document{children.length == 1 ? '' : 's'}</p>
    {/if}
</Actionable>
