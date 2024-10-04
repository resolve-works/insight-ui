<script lang="ts" context="module">
	export class Upload extends EventTarget {
		id: string;
		parent_id: string | undefined;
		file: File;
		// https://github.com/whatwg/fetch/issues/607
		// Fetch doesn't allow tracking progress for now
		xhr: XMLHttpRequest = new XMLHttpRequest();
		// Track progress
		total: number;
		loaded = 0;
		error: string | undefined = undefined;

		is_started = false;

		constructor(file: File, parent_id: string | undefined) {
			super();
			this.id = self.crypto.randomUUID();
			this.parent_id = parent_id;
			this.file = file;
			this.total = file.size;
		}

		finish() {
			this.dispatchEvent(new Event('finished'));
		}

		// Update is here to trigger svelte reactivity
		update() {
			this.dispatchEvent(new Event('update'));
		}

		start() {
			this.is_started = true;

			this.xhr.upload.addEventListener('progress', (e) => {
				this.loaded = e.loaded;
				this.total = e.total;
				this.update();
			});

			this.xhr.addEventListener('loadend', (e) => {
				if (this.xhr.status == 200) {
					this.finish();
				} else {
					const data = JSON.parse(this.xhr.response);
					this.error = data.message;
					this.update();
				}
			});

			const data = new FormData();
			data.append('file', this.file);
			if (this.parent_id) {
				data.append('parent_id', this.parent_id);
			}

			this.xhr.open('POST', `/files/upload`, true);
			this.xhr.send(data);
		}
	}
</script>

<script lang="ts">
	import Card from '$lib/Card.svelte';
	import Icon from './Icon.svelte';

	export let upload: Upload;
	// Re-assign to trigger svelte reactivity
	upload.addEventListener('update', () => {
		upload = upload;
	});
</script>

<Card>
	<header>
		<h3>{upload.file.name}</h3>

		{#if upload.error}
			<button on:click={() => upload.finish()}><Icon class="gg-close" /></button>
		{/if}
	</header>

	<progress value={upload.loaded} max={upload.total}></progress>

	{#if upload.error}
		<p data-testid="upload-error"><Icon class="gg-danger error" /> {upload.error}</p>
	{/if}
</Card>

<style>
	header {
		display: flex;
		justify-content: space-between;
	}

	button {
		padding: 0.75rem;
		border-color: transparent;
		background-color: transparent;
	}

	progress {
		width: 100%;
		accent-color: var(--color-primary);
	}

	p {
		color: var(--color-error);
		display: flex;
		gap: 0.5rem;
	}
</style>
