
<script lang=ts>
    import Card from "$lib/Card.svelte";

    export let upload
</script>

<Card>
    <h3>{upload.file.name}</h3>
</Card>

<style>
</style>
