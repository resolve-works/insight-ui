<script lang="ts">
	import { getContext } from 'svelte';
	import * as pdfjs from 'pdfjs-dist';
	import type { PDFWorker } from 'pdfjs-dist';
	import 'pdfjs-dist/web/pdf_viewer.css';
	import { browser } from '$app/environment';

	interface Props {
		url: string;
		page_number: number;
		highlights: string[] | undefined;
	}

	let { url, page_number, highlights = [] }: Props = $props();

	let container: HTMLElement;
	let canvas: HTMLCanvasElement;
	let text: HTMLElement;

	// Re-use existing worker so we don't load a new one every time we render a document
	const worker: PDFWorker = getContext('pdfjs-worker');

	const pdf_promise = $derived(pdfjs.getDocument({ url, worker }).promise);
	const page_promise = $derived(pdf_promise.then((pdf) => pdf.getPage(page_number)));

	$effect(async () => {
		const page = await page_promise;
		const default_viewport = page.getViewport({ scale: 1 });
		const scale = container.clientWidth / default_viewport.width;
		const viewport = page.getViewport({ scale: scale });
		// Support HiDPI-screens.
		const outputScale = window.devicePixelRatio || 1;

		const context = canvas.getContext('2d');
		if (!context) {
			throw Error('Could not get rendering context');
		}

		canvas.width = Math.floor(viewport.width * outputScale);
		canvas.height = Math.floor(viewport.height * outputScale);
		canvas.style.width = Math.floor(viewport.width) + 'px';
		canvas.style.height = Math.floor(viewport.height) + 'px';

		const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

		page.render({ canvasContext: context, transform, viewport });
	});

	$effect(async () => {
		const page = await page_promise;
		const default_viewport = page.getViewport({ scale: 1 });
		const scale = container.clientWidth / default_viewport.width;
		const viewport = page.getViewport({ scale: scale });
		text.innerHTML = '';
		text.style.setProperty('--scale-factor', scale.toString());

		const text_layer = new pdfjs.TextLayer({
			textContentSource: await page.getTextContent(),
			container: text,
			viewport
		});

		// Try to highlight
		if (text_layer) {
			await text_layer.render();
		}

		for (let child of text.children) {
			if (!child.textContent) {
				continue;
			}

			let innerHTML = child.textContent;

			for (let highlight of highlights) {
				const match = innerHTML.match(new RegExp(String.raw`\b${highlight}\b`, 'i'));
				if (match) {
					// Replace the word in the match to keep the original whitespace
					// TODO - this could replace the "strong" tag itself
					innerHTML = innerHTML.replace(
						match[0],
						match[0].replace(highlight, `<em class="highlight">${highlight}</em>`)
					);
				}
			}

			child.innerHTML = innerHTML;
		}
	});
</script>

<div class="viewer" bind:this={container}>
	<canvas bind:this={canvas}></canvas>

	<div class="textLayer" bind:this={text}></div>
</div>

<style>
	:global(.textLayer .highlight) {
		--highlight-bg-color: color-mix(in srgb, var(--color-primary-lighter) 20%, transparent);
	}

	.viewer {
		position: relative;
		justify-content: center;
		max-width: 64rem;
		margin: 0 auto;
	}

	:global(.viewer em) {
		font-style: normal;
	}
</style>
