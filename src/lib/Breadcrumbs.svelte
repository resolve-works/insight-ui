
<script lang="ts" context="module">
    export type Breadcrumb = {
        name: string,
        path: string,
    }
</script>

<script lang="ts">
    import { breadcrumbs } from './stores';
</script>

<ul>
    <li><a href="/">Home</a></li>

    {#each $breadcrumbs as crumb}
        <li><a href={crumb.path}>{crumb.name}</a></li>
    {/each}
</ul>

<style>
    ul {
        margin: 0;
        padding: 1.5rem 0;
        list-style-type: none;
        display: flex;
    }

    li {
        margin-right: 1rem;
    }

    li:after {
        margin-left: 1rem;
        content: "›"
    }

    li:last-child a {
        text-decoration: none;
        color: var(--text-color-dark);
    }

    li:last-child:after {
        content: "";
    }
</style>
