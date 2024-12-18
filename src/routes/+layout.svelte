<script lang="ts">
	import '@fontsource-variable/rubik/index.css';
	import '@fontsource-variable/roboto-slab/index.css';

	import { onMount, setContext } from 'svelte';
	import { invalidate } from '$app/navigation';
	import Navigation from '$lib/Navigation.svelte';
	import { browser } from '$app/environment';

	// Create PDF worker in context once to prevent creating a new worker on every PDFViewer load
	import * as pdfjs from 'pdfjs-dist';
	import worker_url from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
	interface Props {
		children?: import('svelte').Snippet;
	}

	const DEBOUNCE_MILLISECONDS = 3000;

	let { children }: Props = $props();

	if (browser) {
		pdfjs.GlobalWorkerOptions.workerSrc = worker_url;
		setContext('pdfjs-worker', new pdfjs.PDFWorker());
	}

	const debounced_keys: string[] = [];

	onMount(() => {
		const source = new EventSource('/events');

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
					// Debounce to prevent overloading API in case when many events are triggered
					if (!debounced_keys.includes(key)) {
						invalidate(key);
						debounced_keys.push(key);
						setTimeout(
							() => debounced_keys.splice(debounced_keys.indexOf(key), 1),
							DEBOUNCE_MILLISECONDS
						);
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
