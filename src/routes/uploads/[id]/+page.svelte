
<script lang="ts">
    import IndexPage from `../IndexPage.svelte`;
    import ViewPage from `../ViewPage.svelte`;
    import { breadcrumbs } from '$lib/stores';

    export let data;
    export let form;

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

{#if data.file_id}
    <ViewPage {...data} />
{:else}
    <IndexPage {...data} />
{/if}

