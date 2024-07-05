
<script lang="ts">
    import Icon from "./Icon.svelte";
    import { page as page_store } from "$app/stores";

    export let first_item: number | undefined;
    export let last_item: number | undefined;
    export let amount_of_items: number;
    export let page: number;
    export let amount_of_pages: number;

    function url_for_page(page: number) {
        $page_store.url.searchParams.set('page', (page + 1).toString())
        return  $page_store.url.toString()
    }

    $: previous_page = page > 0 ? page - 1 : 0;
    $: next_page = (page + 1) < amount_of_pages ? page + 1 : page;
</script>

<aside>
    <a href="{url_for_page(previous_page)}" class="button"><Icon class="gg-chevron-left" /></a>

    <p>
        <span>{first_item !== undefined ? first_item + 1 : 0}</span> 
        - <span>{last_item !== undefined ? last_item + 1 : 0}</span>
        of
        <span>{amount_of_items}</span>
    </p>

    <a href="{url_for_page(next_page)}" class="button"><Icon class="gg-chevron-right" /></a>
</aside>

<style>
    aside {
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 1rem 0;
    }

    span {
        font-weight: bold;
    }

    p {
        margin: 0 1rem;
    }
</style>
