<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import * as pdfjs from 'pdfjs-dist';
	import 'pdfjs-dist/web/pdf_viewer.css';
	import type { PDFDocumentProxy, PDFPageProxy, PDFWorker } from 'pdfjs-dist';

	interface Props {
		url: string;
		page_number: number;
		highlights: string[] | undefined;
	}

	let { url, page_number, highlights = [] }: Props = $props();

	let container: HTMLElement;
	let canvas: HTMLCanvasElement;
	let text: HTMLElement;

	onMount(async () => {
		// Re-use existing worker so we don't load a new one every time we render a document
		const worker: PDFWorker = getContext('pdfjs-worker');

		let pdf: PDFDocumentProxy | undefined = $state(undefined);
		let page: PDFPageProxy | undefined = $state(undefined);
		let text_content: any | undefined = $state(undefined);

		$effect(async () => {
			if (pdf == undefined) {
				pdf = await pdfjs.getDocument({ url, worker }).promise;
			}
		});

		$effect(async () => {
			page = undefined;
			text_content = undefined;
			if (pdf !== undefined) {
				page = await pdf.getPage(page_number);
				text_content = await page.getTextContent();
			}
		});

		$effect(async () => {
			if (page != undefined) {
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

				await page.render({ canvasContext: context, transform, viewport });
			}
		});

		$effect(async () => {
			text.innerHTML = '';
			// Array.isArray(highlights) is only here to track highlights and
			// re-render text on highlight change, it won't track changes after
			// await
			// https://svelte.dev/docs/svelte/$effect#Understanding-dependencies
			if (page != undefined && text_content != undefined && Array.isArray(highlights)) {
				const default_viewport = page.getViewport({ scale: 1 });
				const scale = container.clientWidth / default_viewport.width;
				const viewport = page.getViewport({ scale: scale });

				text.style.setProperty('--scale-factor', scale.toString());

				const text_layer = new pdfjs.TextLayer({
					textContentSource: text_content,
					container: text,
					viewport
				});

				// Try to highlight
				await text_layer.render();

				for (let child of text.children) {
					if (!child.textContent) {
						continue;
					}

					let innerHTML = child.textContent;

					for (const highlight of highlights) {
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
			}
		});
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
