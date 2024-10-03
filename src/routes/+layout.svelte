<script>
	import '@fontsource-variable/rubik/index.css';
	import '@fontsource-variable/roboto-slab/index.css';

	import { onMount, onDestroy, setContext } from 'svelte';
	import { invalidate } from '$app/navigation';
	import Navigation from '$lib/Navigation.svelte';
	import { browser } from '$app/environment';

	// Create PDF worker in context once to prevent creating a new worker on every PDFViewer load
	import * as pdfjs from 'pdfjs-dist/build/pdf.mjs';
	import worker_url from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
	setContext('pdfjs', pdfjs);

	if (browser) {
		pdfjs.GlobalWorkerOptions.workerSrc = worker_url;
		setContext('pdfjs-worker', new pdfjs.PDFWorker());
	}

	let ac = new AbortController();

	class StreamAbortedError extends Error {}

	async function getEvents() {
		const source = new EventSource('/events');
		source.addEventListener('message', (message) => {
			const body = JSON.parse(message.data);

			const mapping = {
				ingest_file: ['api:inodes'],
				index_inode: ['api:inodes'],
				embed_file: ['api:inodes'],
				answer_prompt: ['api:conversations']
			};

			if ('task' in body && body.task in mapping) {
				// @ts-ignore
				for (const key of mapping[body.task]) {
					invalidate(key);
				}
			}
		});
	}

	onMount(() => {
		getEvents();
	});

	onDestroy(() => {
		ac.abort(new StreamAbortedError());
	});
</script>

<div class="container">
	<Navigation />

	<slot />
</div>

<style>
	.container {
		display: grid;
		grid-template-columns: 18rem 24rem 6fr 5fr;
	}
</style>
