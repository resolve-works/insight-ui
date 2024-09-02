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
		try {
			// Fetch will error with AbortError when abort is called
			const response = await fetch('/events', { signal: ac.signal });
			if (!response.body) {
				throw new Error('Expected response body from the events path');
			}

			const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
			while (true) {
				const { value, done } = await reader.read();

				if (value === undefined) {
					continue;
				}

				// Multiple messages can be concatenated together when they are sent at the same time
				const messages = value.trim().split('\n\n');
				for (const message of messages) {
					const body = JSON.parse(message);

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
				}

				if (done) {
					break;
				}
			}
		} catch (error) {
			if (!(error instanceof StreamAbortedError)) {
				throw error;
			}
		}
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
