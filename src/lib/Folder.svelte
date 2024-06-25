
<script lang=ts>
    import Icon from "$lib/Icon.svelte";

    export let id
    export let name
</script>

<a href="/folders/{id}">
    <Icon class="gg-folder" />

    {name}
</a>

<style>
    a {
        display: flex;
        flex-direction: row;
        gap: 0.8rem;
        margin-bottom: 0.5rem;
        color: var(--text-color-white);
    }
</style>
