<script lang="ts">
    import { onMount } from 'svelte';
    import worker_url from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

    export let url: string;
    export let index: number;

    let container: HTMLElement;
    let canvas: HTMLCanvasElement;
    let load_page: Function;

    $: {
        if(load_page) {
            load_page(index)
        }
    }

    onMount(async () => {
        const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');

        GlobalWorkerOptions.workerSrc = worker_url;

        const pdf = await getDocument(url).promise;

        load_page = async (index: number) => {
            const page = await pdf.getPage(index)

            const default_viewport = page.getViewport({ scale: 1, });
            const scale = container.clientWidth / default_viewport.width;
            const viewport = page.getViewport({ scale: scale, });
            // Support HiDPI-screens.
            const outputScale = window.devicePixelRatio || 1;

            const context = canvas.getContext('2d');
            if( ! context ) {
                throw Error('Could not get rendering context')
            }

            canvas.width = Math.floor(viewport.width * outputScale);
            canvas.height = Math.floor(viewport.height * outputScale);
            canvas.style.width = Math.floor(viewport.width) + "px";
            canvas.style.height =  Math.floor(viewport.height) + "px";

            const transform = outputScale !== 1
              ? [outputScale, 0, 0, outputScale, 0, 0]
              : undefined;

            page.render({ canvasContext: context, transform, viewport });
        }
    })
</script>

<article bind:this={container}>
    <canvas bind:this={canvas} />
</article>

<style>
    article {
        display: grid;
        justify-content: center;
        max-width: 80rem;
        margin: 0 auto;
    }
</style>
