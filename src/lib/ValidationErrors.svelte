
<script lang="ts">
    export let title: string;
    export let errors: string[];
</script>

<h4>{title}:</h4>
<ul>
    {#each errors as error}
        <li>{error}</li>
    {/each}
</ul>

<style>
    ul {
        color: var(--color-primary);
    }
</style>
