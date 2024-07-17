
<script lang=ts>
    import { enhance } from '$app/forms';
    import Page from '$lib/Page.svelte';
    import Icon from '$lib/Icon.svelte';
    import Card from '$lib/Card.svelte';
    import Actions from '$lib/Actions.svelte';
    import Unnamed from '$lib/Unnamed.svelte';
    import ValidationErrors from '$lib/ValidationErrors.svelte';
    import Section from '$lib/Section.svelte';
    import { breadcrumbs } from '$lib/stores';
    import Title from '$lib/Title.svelte';

    export let data;
    export let form;

    $: { 
        breadcrumbs.set([ 
            { name: 'Uploads', path: '/files' },
            ...data.ancestors.map((ancestor: Record<string, string>) => {
                return { 
                    name: ancestor.name, 
                    path: `/files/${ancestor.id}` 
                }
            }),
            { name: data.name, path: `/files/${data.id}` },
            { name: 'Edit', path: `/files/${data.id}/edit` },
        ]) 
    }
</script>

<Page>
    <Section>
        <Title>
            {#if data.name}
                Edit "{data.name}"
            {:else}
                Edit "<Unnamed />"
            {/if}
        </Title>

        <Card>
            <form method="POST" action="?/update_name" use:enhance={() => async ({ update }) => update({ reset: false })}>
                <input type="text" name="name" placeholder="Document name" value={data.name} />

                <button class="primary" disabled={ ! data.files.is_ready }>
                    <Icon class="gg-pen" /> Change name
                </button>
            </form>
        </Card>
    </Section>

    <h2>
        File
    </h2>
    <p>
        <a href={`/files/${data.files.id}`}>{data.name}</a>. Uploads can be split into different documents.
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

            <Actions>
                {#if ! data.files.is_ready }
                    <Icon class="gg-loadbar" />
                {/if}

                <button class="primary" disabled={ ! data.files.is_ready }>
                    <Icon class="gg-copy" /> Update split
                </button>
            </Actions>
        </form>
    </Card>
</Page>

<style>
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
