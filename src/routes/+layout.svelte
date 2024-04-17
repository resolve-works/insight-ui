<script>
    import '@fontsource-variable/rubik/index.css';
    import '@fontsource-variable/roboto-slab/index.css';

    import { onMount, onDestroy } from "svelte";
    import { invalidate } from "$app/navigation";
    import Navigation from '$lib/Navigation.svelte';

    let ac = new AbortController();

    class StreamAbortedError extends Error {}

    async function getEvents() {
        try {
            // Fetch will error with AbortError when abort is called
            const response = await fetch("/events", { signal: ac.signal });
            if( ! response.body) {
                throw new Error('Expected response body from the events path')
            }

            const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
            while (true) {
                const { value, done } = await reader.read();

                if( value === undefined ) {
                    continue;
                }

                // Multiple messages can be concatenated together when they are sent at the same time
                const messages = value.trim().split('\n\n');
                for(const message of messages) {
                    const body = JSON.parse(message);

                    const mapping = {
                        upload_file: ['api:files'],
                        analyze_file: ['api:files'],
                        ingest_document: ['api:files', 'api:documents'],
                        index_document: ['api:files', 'api:documents'],
                        embed_document: ['api:files', 'api:documents'],
                        answer_prompt: ['api:conversations'],
                    }

                    if('task' in body && body.task in mapping) {
                        // @ts-ignore
                        for(const key of mapping[body.task]) {
                            invalidate(key)
                        }
                    }
                }

                if (done) {
                    break;
                }
            }
        } catch(error) {
            if( ! (error instanceof StreamAbortedError)) {
                throw error;
            }
        }
    }

    onMount(() => {
        getEvents();
    })

    onDestroy(() => {
        ac.abort(new StreamAbortedError());
    });
</script>

<div class="container">
    <nav>
        <div class="sticky">
            <Navigation />
        </div>
    </nav>

    <slot />
</div>

<style>
    :root {
        --box-shadow: 0 0 1rem 0 rgba(0, 0, 0, 0.5);
    }

    .container {
        display: grid;

        grid-template-areas:
            "nav content content content"
            "nav content content content"
            "nav content content content";
        grid-template-columns: 19rem 32rem 6fr 5fr;
        grid-template-rows: var(--header-height) 1fr var(--footer-height);

        height: 100vh;
    }

    nav {
        display: grid;
        grid-area: nav;
    }

    .sticky {
        height: 100vh;
        display: grid;
        grid-template-rows: var(--header-height) 1fr var(--footer-height);
        top: 0;
        position: sticky;
        z-index: 3;
        color: var(--text-color-light);
    }
</style>
