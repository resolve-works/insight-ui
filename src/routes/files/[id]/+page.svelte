
<script lang="ts">
    import IndexPage from `../IndexPage.svelte`;
    import ViewPage from `../ViewPage.svelte`;
    import { breadcrumbs } from '$lib/stores';

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
        ]) 
    }
</script>

{#if data.file_id}
    <ViewPage {...data} />
{:else}
    <IndexPage {...data} />
{/if}

