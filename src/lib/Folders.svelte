
<script>
    import Folder from "./Folder.svelte";
    export let folders
</script>

<ul>
    {#if folders.length}
        {#each folders as folder (folder.id)}
            <li>
                <Folder name={folder.name} path="/uploads/folders/{folder.id}" />
            </li>
        {/each}
    {:else}
        <li class="empty">No folders yet</li>
    {/if}
</ul>


<style>
    ul {
        list-style-type: none;
    }

    .empty {
        opacity: 0.5;
    }
</style>
