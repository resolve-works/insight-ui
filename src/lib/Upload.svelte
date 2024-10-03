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

		is_started = false;

		constructor(file: File, parent_id: string | undefined) {
			super();
			this.id = self.crypto.randomUUID();
			this.parent_id = parent_id;
			this.file = file;
			this.total = file.size;
		}

		start() {
			this.is_started = true;

			this.xhr.upload.addEventListener('progress', (e) => {
				this.loaded = e.loaded;
				this.total = e.total;
				this.dispatchEvent(new Event('progress'));
			});

			// TODO - handle error states
			this.xhr.upload.addEventListener('loadend', async () => {
				this.dispatchEvent(new Event('finished'));
			});

			const data = new FormData();
			data.append('files', this.file);
			if (this.parent_id) {
				data.append('parent_id', this.parent_id);
			}

			this.xhr.open('POST', `?/upload`, true);
			this.xhr.send(data);
		}
	}
</script>

<script lang="ts">
	import Card from '$lib/Card.svelte';

	export let upload: Upload;
	// Re-assign to trigger svelte reactivity
	upload.addEventListener('progress', () => {
		upload = upload;
	});
</script>

<Card>
	<h3>{upload.file.name}</h3>
	<progress value={upload.loaded} max={upload.total}></progress>
</Card>

<style>
	progress {
		width: 100%;
		accent-color: var(--color-primary);
	}
</style>
