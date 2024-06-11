
<script context="module" lang="ts">
    export class Upload extends EventTarget {
        id: string
        file: File
        // https://github.com/whatwg/fetch/issues/607
        // Fetch doesn't allow tracking progress for now
        xhr: XMLHttpRequest = new XMLHttpRequest()
        // Track progress
        total: number
        loaded = 0

        is_started = false;

        constructor(file: File) {
            super()
            this.id = self.crypto.randomUUID()
            this.file = file
            this.total = file.size
        }

        start() {
            this.is_started = true;

            this.xhr.upload.addEventListener("progress", e => {
                this.loaded = e.loaded;
                this.total = e.total;
            });

            // TODO - handle error states
            this.xhr.upload.addEventListener("loadend", async () => {
                this.dispatchEvent(new Event('upload_finished'))
            });

            const data = new FormData();
            data.append('files', this.file)

            this.xhr.open("POST", '?/upload', true);
            this.xhr.send(data);
        }
    }
</script>

<script lang="ts">
    import Card from '$lib/Card.svelte';

    export let upload: Upload

    let total = upload.file.size;
    let loaded = 0;
</script>

<Card>
    <h3>{upload.file.name}</h3>
    <p>Uploading...</p>
    <progress value={upload.loaded} max={upload.total}></progress>
</Card>

<style>
    progress {
        width: 100%;
        accent-color: var(--color-primary);
    }
</style>
