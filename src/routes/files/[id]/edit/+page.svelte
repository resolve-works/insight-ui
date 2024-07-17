
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

                <button class="primary">
                    <Icon class="gg-pen" /> Change name
                </button>
            </form>
        </Card>
    </Section>
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
</style>
