
<script lang=ts>
    import Icon from "$lib/Icon.svelte";

    export let icon = 'folder'
    export let path
    export let name
</script>

<a href="{path}">
    <Icon class="gg-{icon}" />

    {name}
</a>

<style>
    a {
        display: flex;
        flex-direction: row;
        gap: 0.8rem;
        margin-bottom: 0.6rem;
        color: var(--text-color-white);
        text-decoration: none;
    }
</style>
