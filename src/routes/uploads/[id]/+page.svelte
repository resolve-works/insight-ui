
<script lang="ts">
    import UploadsPage from `$lib/UploadsPage.svelte`;
    import Actionable from '$lib/Actionable.svelte';
    import Actions from '$lib/Actions.svelte';
    import { enhance } from '$app/forms';
    import Page from '$lib/Page.svelte';
    import Card from '$lib/Card.svelte';
    import Icon from '$lib/Icon.svelte';
    import Title from '$lib/Title.svelte';
    import Buttongroup from '$lib/Buttongroup.svelte'
    import ValidationErrors from '$lib/ValidationErrors.svelte';
    import Section from '$lib/Section.svelte';
    import { breadcrumbs } from '$lib/stores';

    export let data;
    export let form;

    // TODO add parent folders to crumbs
    $: { 
        breadcrumbs.set([ 
            { name: 'Uploads', path: '/uploads' },
            ...data.ancestors.map((ancestor: Record<string, string>) => {
                return { 
                    name: ancestor.name, 
                    path: `/uploads/${ancestor.id}` 
                }
            }),
            { name: data.name, path: `/uploads/${data.id}` },
        ]) 
    }
</script>

<UploadsPage {...data} />

<!--<Page>-->
    <!--<Section>-->
        <!--<Title>-->
            <!--{data.name}-->

            <!--<a class="button" href="{data.url}" target="_blank" slot="actions">-->
                <!--<Icon class="gg-software-download" />-->
                <!--Download original-->
            <!--</a>-->
        <!--</Title>-->

        <!--<table>-->
            <!--<tr>-->
                <!--<td><b>Number of pages</b></td>-->
                <!--<td>{data.number_of_pages}</td>-->
            <!--</tr>-->
        <!--</table>-->
    <!--</Section>-->

    <!--<Section>-->
        <!--<h2>Embedded documents</h2>-->

        <!--{#each data.documents as document (document.id)}-->
            <!--<Actionable name={document.name} path={`/uploads/documents/${document.id}`} icon="gg-file-document">-->
                <!--<Actions slot="actions">-->
                    <!--{#if ! document.is_ready }-->
                        <!--<Icon class="gg-loadbar" />-->
                    <!--{/if}-->

                    <!--<Buttongroup>-->
                        <!--<a class='button' href={`/uploads/documents/${document.id}/edit`}>-->
                            <!--<Icon class="gg-pen" /> Edit-->
                        <!--</a>-->

                        <!--<form method="POST" action="?/remove" use:enhance>-->
                            <!--<input type="hidden" name="id" value={document.id} />-->
                            <!--<button><Icon class="gg-trash" /> Delete</button>-->
                        <!--</form>-->
                    <!--</Buttongroup>-->
                <!--</Actions>-->

                <!--<p>-->
                    <!--from page -->
                    <!--<span>{document.from_page}</span> -->
                    <!--to page -->
                    <!--<span>{document.to_page}</span>-->
                <!--</p>-->
            <!--</Actionable>-->
        <!--{/each}-->

        <!--<Card>-->
            <!--<form method="POST" action="?/create" use:enhance>-->
                <!--{#if form?.errors?.from_page?._errors}-->
                    <!--<ValidationErrors title="From page" errors={form?.errors.from_page?._errors} />-->
                <!--{/if}-->
                <!--{#if form?.errors?.to_page?._errors}-->
                    <!--<ValidationErrors title="To page" errors={form?.errors.to_page?._errors} />-->
                <!--{/if}-->

                <!--<div class="document">-->
                    <!--<input -->
                        <!--type="text" -->
                        <!--name="name" -->
                        <!--placeholder="Document name" -->
                        <!--/>-->

                    <!--<div>-->
                        <!--from page -->
                        <!--<input -->
                            <!--type="number" -->
                            <!--name="from_page" -->
                            <!--placeholder="1"-->
                            <!--min="1"-->
                            <!--max={data.number_of_pages}-->
                            <!--class:invalid={form?.errors && "from_page" in form?.errors}-->
                            <!--value={form?.data?.from_page}-->
                            <!--/> -->
                        <!--to page -->
                        <!--<input -->
                            <!--type="number" -->
                            <!--name="to_page" -->
                            <!--class:invalid={form?.errors && "to_page" in form?.errors}-->
                            <!--placeholder="{data.number_of_pages}"-->
                            <!--min="1"-->
                            <!--max={data.number_of_pages}-->
                            <!--value={form?.data?.to_page}-->
                            <!--/>-->
                    <!--</div>-->

                    <!--<button class="primary"><Icon class="gg-add" /> Create</button>-->
                <!--</div>-->
            <!--</form>-->
        <!--</Card>-->
    <!--</Section>-->
<!--</Page>-->

<!--<style>-->
    <!--.document {-->
        <!--display: grid;-->
        <!--grid-template-columns: 1fr auto;-->
        <!--align-items: center;-->
    <!--}-->

    <!--.document input[type=text] {-->
        <!--grid-column: 1 / 3;-->
    <!--}-->

    <!--.document {-->
        <!--padding-bottom: 1rem;-->
    <!--}-->

    <!--span {-->
        <!--font-weight: bold;-->
    <!--}-->

    <!--input[type=text] {-->
        <!--width: 100%;-->
        <!--max-width: 50rem;-->
        <!--margin: 1rem 0;-->
    <!--}-->

    <!--input[type=number] {-->
        <!--max-width: 8rem;-->
        <!--margin: 0 0.5rem;-->
    <!--}-->
<!--</style>-->
