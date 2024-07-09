
<script lang=ts>
    import Card from '$lib/Card.svelte';
    import Icon from '$lib/Icon.svelte';
    import Unnamed from '$lib/Unnamed.svelte';

    export let name: string | undefined;
    export let path: string;
    export let icon: string;
</script>

<Card>
    <header>
        <h3>
            <a class="unstyled" href={path}>
                <Icon class="{icon}" />

                {#if name}
                    {name}
                {:else}
                    <Unnamed />
                {/if}
            </a>
        </h3>

        <slot name="actions" />
    </header>

    <slot />
</Card>

<style>
    header {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 5rem;
        align-items: center;
        justify-content: space-between;
    }

    a {
        display: flex;
        gap: 1rem;
    }
</style>
