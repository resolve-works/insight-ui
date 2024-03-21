
<script lang="ts">
    import { enhance } from '$app/forms';
    import Page from '$lib/Page.svelte';
    import Card from '$lib/Card.svelte';
    import Icon from '$lib/Icon.svelte';
    import Buttongroup from '$lib/Buttongroup.svelte'

    export let data;
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

    <section>
        <h2>Embedded documents</h2>

        {#each data.documents as document}
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
                        <a class='button' href="/new"><Icon class="gg-pen" /> Edit</a>

                        <form method="POST" action="?/remove" use:enhance>
                            <input type="hidden" name="id" value={document.id} />
                            <button><Icon class="gg-trash" /> Delete</button>
                        </form>
                    </Buttongroup>
                </header>

                <p>from page <span>{document.from_page}</span> to page <span>{document.to_page}</span></p>
            </Card>
        {/each}

        <Card>
            <form class="form" method="POST" action="?/create" use:enhance>
                <fieldset>
                    <input type="text" name="name" placeholder="Document name" />
                </fieldset>

                <fieldset class="lower">
                    <div>
                        from page <input type="number" name="from_page" placeholder="1" max="{data.number_of_pages}" /> 
                        to page <input type="number" name="to_page" min="1" placeholder={data.number_of_pages} />
                    </div>

                    <button class="primary"><Icon class="gg-add" /> Create</button>
                </fieldset>
            </form>
        </Card>
    </section>
</Page>

<style>
    header {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
    }

    p {
        margin-top: 0;
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

    fieldset {
        margin: 1rem 0;
        border: none;
        padding: 0;
    }

    fieldset.lower {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
    }
</style>
