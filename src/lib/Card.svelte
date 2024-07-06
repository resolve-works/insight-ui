
<div {...$$props}>
    <slot />
</div>

<style>
    div {
        background: var(--color-white);
        padding: 0.5rem calc(var(--padding-x));
        margin-bottom: 1rem;
        border-bottom: var(--border-size) solid var(--color-page-darker);
    }
</style>
