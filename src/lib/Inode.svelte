
<script lang=ts>
    import { enhance } from '$app/forms';
    import Icon from '$lib/Icon.svelte';
    import Actions from '$lib/Actions.svelte';
    import Actionable from './Actionable.svelte';
    import Buttongroup from '$lib/Buttongroup.svelte';

    export let id: string;
    export let name: string;
    export let files: Record<string, any> | undefined;

    const children = [];

    let icon = files ? 'gg-file-document': 'gg-folder';
</script>

<Actionable {name} path={`/files/${id}`} icon={icon}>
    <Actions slot="actions">
        {#if files && ! files.is_ready}
            <Icon class="gg-loadbar" />
        {/if}

        <Buttongroup>
            <a class="button" href={`/files/${id}/edit`}>
                <Icon class="gg-pen" />
                Edit
            </a>

            {#if files}
                <a class="button" href={`/files/${id}/split`}>
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

    {#if children.length > 1}
        <p>{children.length} embedded document{children.length == 1 ? '' : 's'}</p>
    {/if}
</Actionable>
