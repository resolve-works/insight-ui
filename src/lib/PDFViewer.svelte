<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import 'pdfjs-dist/web/pdf_viewer.css';

	export let url: string;
	export let index: number;
	export let highlights: string[];

	let container: HTMLElement;
	let canvas: HTMLCanvasElement;
	let text: HTMLElement;
	let load_page: Function;
	let set_highlights: Function;

	// Re-use existing worker so we don't load a new one every time we render a document
	const pdfjs = getContext('pdfjs');
	const worker = getContext('pdfjs-worker');

	$: {
		if (load_page) {
			load_page(index);
		}
	}

	$: {
		if (set_highlights) {
			set_highlights(highlights);
		}
	}

	onMount(async () => {
		const pdf = await pdfjs.getDocument({ url, worker }).promise;

		load_page = async (index: number) => {
			const page = await pdf.getPage(index);

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

			const textLayer = pdfjs.renderTextLayer({
				textContentSource: await page.getTextContent(),
				container: text,
				viewport
			});

			// Try to highlight
			if (textLayer) {
				await textLayer.promise;
			}
			set_highlights(highlights);
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
							match[0].replace(highlight, `<strong class="highlight">${highlight}</strong>`)
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

	:global(.viewer strong) {
		font-weight: normal;
	}
</style>
