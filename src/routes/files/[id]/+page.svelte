
<script lang="ts">
    import Page from '$lib/Page.svelte';
    import Card from '$lib/Card.svelte';
    import Icon from '$lib/Icon.svelte';

    export let data;
</script>

<Page>
    <section>
        <header>
            <h2>
                {data.name}
            </h2>

            <a class="button primary" href="{data.url}" target="_blank">
                <Icon class="gg-software-download" />
                Download original
            </a>
        </header>

        <table>
            <tr>
                <td><b>Number of pages</b></td>
                <td>{data.number_of_pages}</td>
            </tr>
        </table>
    </section>

    <section>
        <h2>Embedded documents</h2>

        {#each data.documents as document}
            <Card>
                <h3>
                    {#if document.name}
                        {document.name}
                    {:else}
                        <span class="unnamed">Unnamed document</span>
                    {/if}
                </h3>
            </Card>
        {/each}
    </section>
</Page>

<style>
    header {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
    }

    .unnamed {
        color: var(--text-color-page);
    }
</style>
