
<script lang=ts>
    import { enhance } from '$app/forms';
    import Page from '$lib/Page.svelte';
    import Icon from '$lib/Icon.svelte';
    import Card from '$lib/Card.svelte';

    export let data: Record<any, any>;
</script>

<Page>
    <section>
        <h2>
            Edit document
        </h2>

        <Card>
            <form method="POST" action="?/update_name" use:enhance={() => async ({ update }) => update({ reset: false })}>
                <input type="text" name="name" placeholder="Document name" value={data.name} />

                <button class="primary"><Icon class="gg-pen" /> Change name</button>
            </form>
        </Card>
    </section>

    <h2>
        {#if data.is_whole_document }
            Complete file
        {:else}
            Split file
        {/if}
    </h2>
    <p>
        {#if data.is_whole_document }
            This document is the complete uploaded file 
        {:else}
            This document is a part of the uploaded file 
        {/if}
        <a href={`/uploads/${data.file_id}`}>{data.files.name}</a>. Uploads can be split into different documents.
    </p>

    <Card>
        <form method="POST" action="?/update_split" use:enhance={() => async ({ update }) => update({ reset: false })}>
            <div>
                from page 
                <input type="number" name="from_page" placeholder="1" value={data.from_page} min="1" max="{data.files.number_of_pages}" /> 
                to page 
                <input type="number" name="to_page" min="1" max="{data.files.number_of_pages}" value={data.to_page} placeholder={data.files.number_of_pages} />
            </div>

            <button class="primary"><Icon class="gg-copy" /> Update split</button>
        </form>
    </Card>
</Page>

<style>
    form {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
    }

    form {
        margin: 1rem 0;
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
