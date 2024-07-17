<script lang=ts>
    import { page } from '$app/stores';
    import Icon from '$lib/Icon.svelte';

    const items = [
        { href: "/search", name: "Search", class: "gg-search" },
        { href: "/conversations", name: "Conversations", class: "gg-comment" },
        { href: "/files", name: "Files", class: "gg-folder"},
    ]
</script>

<a class="logo" href="/">
    <h1>Insight</h1>
    <Icon class="gg-menu" />
</a>

<ul>
    {#each items as item}
        <li>
            <a href={item.href} class:active={$page.url.pathname.startsWith(new URL(item.href, $page.url.origin).pathname)}>
                <span>{item.name}</span>
                <Icon class={item.class} />
            </a>
        </li>
    {/each}
</ul>

<form method="POST" action="/auth/logout">
    <button>
        <span>Log out</span>
        <Icon class="gg-log-out" />
    </button>
</form>

<style>
    button {
        background: none;
        border: none;
        font-size: 1rem;
        width: 100%;
    }

    a,
    button {
        grid-template-columns: auto auto;
        justify-content: space-between;
        display: grid;
        align-items: center;
        color: inherit;
        text-decoration: none;
        padding: 1.5rem var(--padding-x);
    }

    a.active {
        background: var(--color-subnavigation);
        border-top: 1px solid transparent;
        border-bottom: 1px solid var(--color-navigation-darker);
    }

    a.logo {
        border-bottom: 1px solid var(--color-navigation-darker);
    }
    a.logo h1 {
        font-size: 1.5rem;
        margin: 0;
    }

    ul {
        padding: 0;
        margin: 0;
    }
    li a {
        border-top: 1px solid var(--color-navigation-lighter);
        border-bottom: 1px solid var(--color-navigation-darker);
    }

    form > button {
        height: 100%;
    }
</style>
