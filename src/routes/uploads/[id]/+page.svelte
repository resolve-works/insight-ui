
<script lang="ts">
    import { enhance } from '$app/forms';
    import Page from '$lib/Page.svelte';
    import Card from '$lib/Card.svelte';
    import Icon from '$lib/Icon.svelte';
    import Buttongroup from '$lib/Buttongroup.svelte'

    export let data;

    let is_enhanced = false;
</script>

<Page>
    <section>
        <header>
            <h2>
                {data.name}
            </h2>

            <a class="button" href="{data.url}" target="_blank">
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

    <section class:enhanced={is_enhanced}>
        <h2>Embedded documents</h2>

        {#each data.documents as document (document.id)}
            <Card>
                <header>
                    <h3>
                        <a class="unstyled" href={`/documents/${document.id}`}>
                            {#if document.name}
                                {document.name}
                            {:else}
                                <span class="unnamed">Unnamed document</span>
                            {/if}
                        </a>
                    </h3>

                    <Buttongroup>
                        <a class='button' href={`/documents/${document.id}/edit`}>
                            <Icon class="gg-pen" /> Edit
                        </a>

                        <form method="POST" action="?/remove" use:enhance>
                            <input type="hidden" name="id" value={document.id} />
                            <button><Icon class="gg-trash" /> Delete</button>
                        </form>
                    </Buttongroup>
                </header>

                <footer>
                    <div>
                        from page 
                        <span>{document.from_page}</span> 
                        to page 
                        <span>{document.to_page}</span>
                    </div>
                </footer>
            </Card>
        {/each}

        <Card>
            <form method="POST" action="?/create" use:enhance>
                <header>
                    <h3>
                        <input type="text" name="name" placeholder="Document name" />
                    </h3>
                </header>

                <footer>
                    <div>
                        from page 
                        <input type="number" name="from_page" placeholder="1" min="1" max="{data.number_of_pages}" /> 
                        to page 
                        <input type="number" name="to_page" placeholder={data.number_of_pages} min="1" max="{data.number_of_pages}" />
                    </div>

                    <button class="primary"><Icon class="gg-add" /> Create</button>
                </footer>
            </form>
        </Card>
    </section>
</Page>

<style>
    header, footer {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
    }

    footer {
        margin-bottom: 1rem;
    }

    span {
        font-weight: bold;
    }

    .unnamed {
        color: var(--text-color-page);
    }

    input[type=text] {
        width: 100%;
        max-width: 50rem;
    }

    input[type=number] {
        max-width: 8rem;
        margin: 0 0.5rem;
    }
</style>
