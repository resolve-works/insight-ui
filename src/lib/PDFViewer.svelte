<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import * as pdfjs from 'pdfjs-dist';
	import type { PDFWorker } from 'pdfjs-dist';
	import 'pdfjs-dist/web/pdf_viewer.css';

	export let url: string;
	export let page_number: number;
	export let highlights: string[] | undefined;

	let container: HTMLElement;
	let canvas: HTMLCanvasElement;
	let text: HTMLElement;
	let load_page: Function;
	let set_highlights: Function;

	// Re-use existing worker so we don't load a new one every time we render a document
	const worker: PDFWorker = getContext('pdfjs-worker');

	$: {
		if (load_page) {
			load_page(page_number);
		}
	}

	$: {
		if (set_highlights) {
			set_highlights(highlights ?? []);
		}
	}

	onMount(async () => {
		const pdf = await pdfjs.getDocument({ url, worker }).promise;

		load_page = async (page_number: number) => {
			const page = await pdf.getPage(page_number);

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
			set_highlights(highlights ?? []);
		};

		// Find all words in the textLayer and wrap them in highlight
		set_highlights = function (highlights: string[]) {
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
		};
	});
</script>

<div class="viewer" bind:this={container}>
	<canvas bind:this={canvas} />

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
