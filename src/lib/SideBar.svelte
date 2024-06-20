<aside>
    <header>
        <slot name="header" />
    </header>

    <slot />
</aside>

<style>
    aside {
        padding: 0 var(--padding-x);
        background: var(--color-subnavigation);
        color: var(--text-color-light);
        box-shadow: var(--box-shadow);
        display: grid;
        grid-template-rows: subgrid;
        grid-column: 2 / 3;
        grid-row: 1 / 4;
        position: sticky;
        top: 0;
        min-height: 100vh;
    }

    header {
        display: grid;
        align-items: center;
    }
    
    header :global(input[type=text]) {
        border-color: var(--color-subnavigation-darker);
    }
</style>
