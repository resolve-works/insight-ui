
<script lang="ts">
    import UploadsPage from '$lib/UploadsPage.svelte';
    import { breadcrumbs } from '$lib/stores';

    export let data;

    $: {
        breadcrumbs.set([
            { name: 'Uploads', path: '/uploads' },
            ...data.parents.map((parent: Record<string, string>) => {
                return { 
                    name: parent.name, 
                    path: `/uploads/folders/${parent.id}` 
                }
            }),
            { name: data.name, path: `/folders/${data.id}` },
        ])
    }
</script>

<UploadsPage name={data.name} files={data.files} folders={data.children} />
