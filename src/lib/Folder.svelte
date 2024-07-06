
<script lang=ts>
    import { enhance } from "$app/forms";
    import Card from "./Card.svelte";
    import Buttongroup from "./Buttongroup.svelte";
    import Icon from "$lib/Icon.svelte";

    export let id
    export let name
</script>

<Card>
    <header>
        <h3>
            <a class="unstyled" href={`/uploads/folders/${id}`}>
                <Icon class="gg-folder" />

                {name}
            </a>
        </h3>

        <div class="actions">
            <Buttongroup>
                <form method="POST" action="?/remove" use:enhance>
                    <input type="hidden" name="id" value={id} />
                    <button><Icon class="gg-trash" /> Delete</button>
                </form>
            </Buttongroup>
        </div>
    </header>
</Card>

<style>
    header {
        display: grid;
        grid-template-columns: auto auto;
        align-items: center;
        justify-content: space-between;
    }

    a {
        display: flex;
        gap: 1rem;
    }

    .actions {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
</style>
