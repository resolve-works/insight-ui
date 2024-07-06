
<header>
    <h2>
        <slot />
    </h2>

    <slot name="actions" />
</header>

<style>
    header {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 1rem;
        align-items: center;
    }

    h2 {
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow-x: hidden;
    }
</style>
