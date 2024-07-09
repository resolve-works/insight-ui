
<script lang=ts>
    import { enhance } from "$app/forms";
    import Actions from "./Actions.svelte";
    import Actionable from "./Actionable.svelte";
    import Buttongroup from "./Buttongroup.svelte";
    import Icon from "$lib/Icon.svelte";

    export let id
    export let name

    $: path = `/uploads/folders/${id}`
</script>

<Actionable {name} {path} icon="gg-folder">
    <Actions slot="actions">
        <Buttongroup>
            <form method="POST" action="/uploads?/remove_folder" use:enhance>
                <input type="hidden" name="id" value={id} />
                <button><Icon class="gg-trash" /> Delete</button>
            </form>
        </Buttongroup>
    </Actions>
</Actionable>
