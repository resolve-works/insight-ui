<script>
    import Document from './Document.svelte'
    import Search from '$lib/Search.svelte'
    import Page from '$lib/Page.svelte';
    import SideBar from '$lib/SideBar.svelte';
    import Section from '$lib/Section.svelte';
    import { page } from '$app/stores';
    import { breadcrumbs } from '$lib/stores';
    const query = $page.url.searchParams.get('query') || ''

    export let data

    $: { breadcrumbs.set([ { name: 'Documents', path: '/documents' }, ]) }
</script>

<SideBar>
    <Search slot="header" value={query} />

    <nav>
        <Section>
            <h2>{data.total} document{data.total == 1 ? '' : 's'} found</h2>
        </Section>
    </nav>
</SideBar>

<Page class="with-sidebar-left">
    {#each data.documents as document }
        <Document {...document} />
    {/each}
</Page>
