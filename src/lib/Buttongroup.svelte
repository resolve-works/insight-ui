
<script lang=ts>
    import { onMount } from "svelte";
    import Icon from "./Icon.svelte";

    let element: HTMLElement;

    let is_enhanced = false;
    let is_open = false;

    function close(e: MouseEvent) {
        if(e.target !== null && ! element.contains(e.target)) {
            is_open = false;
        }
    }

    onMount(() => {
        is_enhanced = true;

        document.addEventListener('click', close)
        return () => {
            document.removeEventListener("click", close);
        }
    })
</script>

<div class="buttongroup" bind:this={element} class:enhance={is_enhanced} class:open={is_open}>
    <button class="toggle" on:click|preventDefault|stopPropagation={() => is_open = ! is_open}><Icon class="gg-more-vertical-alt" /></button>

    <div class="holder">
        <div class="buttons">
            <slot />
        </div>
    </div>
</div>

<style>
    .buttongroup {
        display: flex;
        flex-direction: column;
        align-items: end;
    }

    .holder {
        position: relative;
    }

    .buttons {
        display: flex;
        gap: 0.5rem;
    }

    .toggle {
        display: none;
    }

    .buttongroup.enhance .toggle {
        display: block;
        padding: 0.75rem;
        border-color: transparent;
    }

    .buttongroup.enhance.open .toggle {
        border-color: var(--input-border-color);
        border-bottom-color: var(--color-white);
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        z-index: 1;
    }

    .buttongroup.enhance .buttons {
        display: none;
        flex-direction: column;
        gap: 0;
        min-width: 16rem;
        position: absolute;
        right: 0;
        top: calc(var(--input-border-size) * -1);
        border-radius: var(--input-border-radius);
        border: var(--input-border-size) solid var(--input-border-color);
    }

    .buttongroup.enhance.open .buttons {
        display: block;
    }

    :global(.buttongroup.enhance.open .buttons > *) {
        border-bottom: var(--input-border-size) solid #B5BEC8 !important;
    }

    :global(.buttongroup.enhance.open .buttons > *:last-child) {
        border-bottom: none !important;
    }

    :global(.buttongroup.enhance .buttons input[type=submit]),
    :global(.buttongroup.enhance .buttons .button),
    :global(.buttongroup.enhance .buttons button) {
        border-color: transparent;
        border-top-right-radius: 0;
        width: 100%;
    }
</style>
