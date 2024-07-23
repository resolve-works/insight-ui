<script lang="ts">
	import { tick } from 'svelte';
	import InputGroup from '$lib/InputGroup.svelte';
	import Card from '$lib/Card.svelte';
	import { onMount } from 'svelte';
	import Icon from '$lib/Icon.svelte';
	import Page from '$lib/Page.svelte';
	import Inode from '$lib/Inode.svelte';
	import UploadComponent from '$lib/Upload.svelte';
	import Unnamed from '$lib/Unnamed.svelte';
	import { Upload } from '$lib/Upload.svelte';
	import Title from '$lib/Title.svelte';
	import Section from '$lib/Section.svelte';
	import { uploads } from '$lib/stores.ts';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { invalidate } from '$app/navigation';

	export let name;
	export let inodes;
	export let form;

	const PARALLEL_UPLOADS = 3;

	// Dragevents trigger on every element. Keep track of how many bubbled up to stop drag on window leave
	let counter = 0;
	let files_input: HTMLInputElement;
	let files_form: HTMLFormElement;

	let folder_input: HTMLInputElement;
	let folder_form: HTMLFormElement;
	let show_folder_form = false;

	function dragover(e: DragEvent) {
		e.preventDefault();
	}

	function dragenter(e: DragEvent) {
		e.preventDefault();
		counter++;
	}

	function dragleave(e: DragEvent) {
		e.preventDefault();
		counter--;
	}

	function drop(e: DragEvent) {
		e.preventDefault();
		counter = 0;

		if (!e.dataTransfer) {
			return;
		}

		files_input.files = e.dataTransfer.files;
		files_input.dispatchEvent(new Event('change'));
	}

	// Add files to the uploads store to show nice progress objects to user
	function submit({ formData, cancel }: { formData: FormData; cancel: Function }) {
		const files = formData.getAll('files') as File[];
		const parent_id = formData.get('parent_id') as string;
		uploads.update((uploads) => {
			return [...uploads, ...files.map((file) => new Upload(file, parent_id))];
		});
		cancel();
		return {};
	}

	onMount(() => {
		window.addEventListener('dragover', dragover);
		window.addEventListener('dragenter', dragenter);
		window.addEventListener('dragleave', dragleave);
		window.addEventListener('drop', drop);

		return () => {
			window.removeEventListener('dragover', dragover);
			window.removeEventListener('dragenter', dragenter);
			window.removeEventListener('dragleave', dragleave);
			window.removeEventListener('drop', drop);
		};
	});

	$: {
		for (const upload of $uploads.slice(0, PARALLEL_UPLOADS)) {
			// Start active uploads that have not been started yet.
			if (!upload.is_started) {
				// Remove uploads from store on completion
				upload.addEventListener('upload_finished', () => {
					invalidate('api:inodes');
					uploads.update((uploads) => uploads.filter((u) => u != upload));
				});

				upload.start();
			}
		}
	}

	$: started = $uploads.filter((upload) => upload.is_started);
	$: pending = $uploads.filter((upload) => !upload.is_started);
</script>

<Page>
	{#if started.length > 0}
		<Section>
			<h3>Uploading...</h3>
			{#each started as upload (upload.id)}
				<UploadComponent {upload} />
			{/each}

			{#if pending.length > 0}
				<p>{pending.length} upload{pending.length > 1 ? 's' : ''} pending...</p>
			{/if}
		</Section>
	{/if}

	<Title>
		{#if name}
			{name}
		{:else}
			<Unnamed />
		{/if}

		<InputGroup slot="actions">
			<form
				method="POST"
				action="?/upload"
				enctype="multipart/form-data"
				bind:this={files_form}
				use:enhance={submit}
			>
				<input
					name="files"
					type="file"
					accept=".pdf"
					multiple
					bind:this={files_input}
					on:change={() => files_form.requestSubmit()}
				/>
				{#if $page.params.id}
					<input name="parent_id" type="hidden" value={$page.params.id} />
				{/if}
				<button on:click|preventDefault={() => files_input.click()}>
					<Icon class="gg-software-upload" />
					Upload PDFs
				</button>
			</form>

			<button
				on:click|preventDefault={async () => {
					show_folder_form = true;
					await tick();
					folder_input.focus();
				}}
			>
				<Icon class="gg-folder-add" />
				Create Folder
			</button>
		</InputGroup>
	</Title>

	<h2 class="drop-message" class:dragover={counter > 0}>
		<Icon class="gg-software-upload" />
		Drop PDF files to upload
	</h2>

	<div class="create-folder" class:visible={show_folder_form}>
		<Card>
			<form
				class="create-folder-form"
				method="POST"
				action="?/create_folder"
				use:enhance={() => {
					show_folder_form = false;
				}}
				bind:this={folder_form}
			>
				{#if $page.params.id}
					<input name="parent_id" type="hidden" value={$page.params.id} />
				{/if}

				<Icon class="gg-folder" />

				<input name="name" placeholder="Folder name" bind:this={folder_input} />

				<InputGroup>
					<button class="primary">Create</button>

					<button
						on:click|preventDefault={() => {
							folder_form.reset();
							show_folder_form = false;
						}}>Cancel</button
					>
				</InputGroup>
			</form>

			{#if form?.error}
				<p class="error">{form.error}</p>
			{/if}
		</Card>
	</div>

	{#each inodes as inode (inode.id)}
		<Inode {...inode} />
	{/each}

	{#if !inodes.length}
		<p>empty</p>
	{/if}
</Page>

<style>
	.drop-message {
		padding: 3rem;
		border: 3px dashed var(--color-primary);
		display: none;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		color: var(--color-primary);
	}
	.drop-message :global(.gg-software-upload) {
		--ggs: 1.5;
	}
	.drop-message.dragover {
		display: flex;
	}

	input[name='files'] {
		display: none;
	}

	.create-folder {
		display: none;
	}

	.create-folder.visible {
		display: block;
	}

	.create-folder form {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin: 0.5rem 0;
	}

	.create-folder form input {
		flex-grow: 1;
	}
</style>
