
<script lang=ts>
    import { enhance } from '$app/forms';
    import Page from '$lib/Page.svelte';
    import Icon from '$lib/Icon.svelte';
    import Card from '$lib/Card.svelte';
    import Unnamed from '$lib/Unnamed.svelte';
    import ValidationErrors from '$lib/ValidationErrors.svelte';
    import Section from '$lib/Section.svelte';
    import { breadcrumbs } from '$lib/stores';
    import Title from '$lib/Title.svelte';

    export let data;
    export let form;

    $: { 
        breadcrumbs.set([ 
            { name: 'Documents', path: '/documents' },
            { name: data.name, path: `/documents/${data.id}` },
            { name: 'Edit', path: `/documents/${data.id}/edit` },
        ]) 
    }
</script>

<Page>
    <Section>
        <Title>
            {#if data.name}
                Edit "{data.name}"
            {:else}
                Edit "<Unnamed>Unnamed Document</Unnamed>"
            {/if}
        </Title>

        <Card>
            <form method="POST" action="?/update_name" use:enhance={() => async ({ update }) => update({ reset: false })}>
                <input type="text" name="name" placeholder="Document name" value={data.name} />

                <button class="primary" disabled={ ! data.is_ready }>
                    <Icon class="gg-pen" /> Change name
                </button>
            </form>
        </Card>
    </Section>

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
        {#if form?.errors?.from_page?._errors}
            <ValidationErrors title="From page" errors={form?.errors.from_page?._errors} />
        {/if}
        {#if form?.errors?.to_page?._errors}
            <ValidationErrors title="To page" errors={form?.errors.to_page?._errors} />
        {/if}

        <form method="POST" action="?/update_split" use:enhance={() => async ({ update }) => update({ reset: false })}>
            <div>
                from page 
                <input 
                    type="number" 
                    name="from_page" 
                    placeholder="1"
                    min="1"
                    max={data.files.number_of_pages}
                    class:invalid={form?.errors && "from_page" in form?.errors}
                    value={form?.data?.from_page ?? data.from_page}
                    /> 
                to page 
                <input 
                    type="number" 
                    name="to_page" 
                    class:invalid={form?.errors && "to_page" in form?.errors}
                    placeholder="{data.files.number_of_pages}"
                    min="1"
                    max={data.files.number_of_pages}
                    value={form?.data?.to_page ?? data.to_page}
                    />
            </div>

            <div class="actions">
                {#if ! data.is_ready }
                    <Icon class="gg-loadbar" />
                {/if}

                <button class="primary" disabled={ ! data.is_ready }>
                    <Icon class="gg-copy" /> Update split
                </button>
            </div>
        </form>
    </Card>
</Page>

<style>
    .actions {
        display: flex;
        gap: 2rem;
        align-items: center;
    }

    form {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
    }

    input,
    button {
        margin: 1rem 0;
    }

    input[type=text] {
        width: 100%;
        max-width: 50rem;
    }

    input[type=number] {
        max-width: 8rem;
        margin: 1rem 0.5rem;
    }
</style>
