
<script lang="ts">
    import Icon from '$lib/Icon.svelte';
    import Actionable from '$lib/Actionable.svelte';
    export let id: string;
    export let filename: string;
    export let pages: { index: number, highlights: string[] }[];
</script>

<Actionable name={filename} path={`/documents/${id}`} icon="gg-file-document">
    {#each pages as page}
        <a class="page" href={`/documents/${id}?page=${page.index}`}>
            <span class="index">
                <Icon class="gg-file" />
                {page.index}
            </span>

            <ul>
                {#each page.highlights as highlight}
                    <li>{@html highlight}</li>
                {/each}
            </ul>
        </a>
    {/each}
</Actionable>

<style>
    .index {
        display: grid;
        height: 2rem;
        grid-template-columns: 2rem auto;
        align-items: center;
    }

    .page {
        display: grid;
        grid-template-columns: 3rem auto;
        align-items: top;
        line-height: 2rem;
        text-decoration: none;
        color: currentColor;
    }

    .page:hover span {
        text-decoration: underline;
        color: var(--color-primary);
    }

    ul {
        list-style-type: none;
        margin: 0 0 1rem 0;
        padding: none;
    }

    li {
        border-top: 1px solid var(--color-page);
        padding: 0.5rem 0;
    }

    li:first-child {
        padding-top: 0;
        border-top: none;
    }

    li :global(em) {
        color: var(--color-primary);
        font-weight: bold;
    }
</style>
