<script lang="ts">
	import '@fontsource-variable/rubik/index.css';
	import '@fontsource-variable/roboto-slab/index.css';

	import { onMount, setContext } from 'svelte';
	import { invalidate } from '$app/navigation';
	import Navigation from '$lib/Navigation.svelte';

	// Create PDF worker in context once to prevent creating a new worker on every PDFViewer load
	import { PDFWorker, GlobalWorkerOptions } from 'pdfjs-dist';
	import worker_url from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	const DEBOUNCE_MILLISECONDS = 1000;
	const debounced: Record<string, ReturnType<typeof setTimeout>> = {};

	onMount(() => {
		const source = new EventSource('/events');

		// Create PDF service worker that can be used by PDF pages
		GlobalWorkerOptions.workerSrc = worker_url;
		setContext('pdfjs-worker', new PDFWorker());

		source.addEventListener('message', (message) => {
			const body = JSON.parse(message.data);

			const mapping = {
				ingest_inode: ['api:inodes'],
				embed_inode: ['api:inodes'],
				index_inode: ['api:inodes']
			};

			if ('task' in body && body.task in mapping) {
				// @ts-ignore
				for (const key of mapping[body.task]) {
					switch (body.type) {
						// Handle private messages directly
						case 'user':
							invalidate(key);
							break;
						// Debounce public messages as to not overload API
						case 'public':
							if (key in debounced) {
								clearTimeout(debounced[key]);
							}
							debounced[key] = setTimeout(() => {
								invalidate(key);
								delete debounced[key];
							}, DEBOUNCE_MILLISECONDS);
							break;
					}
				}
			}
		});

		return () => {
			source.close();
		};
	});
</script>

<div class="container">
	<Navigation />

	{@render children?.()}
</div>

<style>
	.container {
		display: grid;
		grid-template-columns: 18rem 24rem 6fr 5fr;
	}
</style>
