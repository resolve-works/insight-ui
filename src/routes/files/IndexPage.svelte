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
	import { invalidate } from '$app/navigation';
	import Pagination from '$lib/Pagination.svelte';
	import InputRow from '$lib/InputRow.svelte';
	import FormErrors from '$lib/FormErrors.svelte';

	export let name;
	export let inodes;
	export let form;

	export let parent_id: number | undefined;
	export let path: string;

	// Pagination
	export let page;
	export let first_item;
	export let last_item;
	export let amount_of_items;
	export let amount_of_pages;

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

	// Add files to the uploads store to show nice progress objects to user.
	// This defeats the purpose of svelte enhance though.
	function create_uploads(e: SubmitEvent) {
		const form_data = new FormData(e.target as HTMLFormElement);
		const files = form_data.getAll('files') as File[];
		const parent_id = form_data.get('parent_id') as string;
		uploads.update((uploads) => {
			return [...uploads, ...files.map((file) => new Upload(file, parent_id))];
		});
		// Prevent form submission
		return false;
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
				upload.addEventListener('finished', () => {
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
			<form bind:this={files_form} on:submit={create_uploads}>
				<input
					name="files"
					data-testid="files-input"
					type="file"
					accept=".pdf"
					multiple
					bind:this={files_input}
					on:change={() => files_form.requestSubmit()}
				/>
				{#if parent_id}
					<input name="parent_id" type="hidden" value={parent_id} />
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
				data-testid="show-folder-form"
			>
				<Icon class="gg-folder-add" />
				Create Folder
			</button>

			<form action="/conversations?/create_conversation" method="POST">
				<input type="hidden" name="folders[]" value={path} />

				<button
					title="Start conversation about the files in this folder"
					data-testid="start-conversation"
				>
					<Icon class="gg-comment" />
					Start Conversation
				</button>
			</form>
		</InputGroup>
	</Title>

	<h2 class="drop-message" class:dragover={counter > 0}>
		<Icon class="gg-software-upload" />
		Drop PDF files to upload
	</h2>

	<div class="create-folder" class:visible={show_folder_form || form?.errors}>
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
				{#if parent_id}
					<input name="parent_id" type="hidden" value={parent_id} />
				{/if}

				<InputRow icon="gg-folder">
					<div slot="input">
						<input
							name="name"
							data-testid="folder-name-input"
							placeholder="Folder name"
							bind:this={folder_input}
						/>

						<FormErrors errors={form?.errors} key="name" />
					</div>

					<InputGroup>
						<button class="primary" data-testid="create-folder">Create</button>

						<button
							data-testid="cancel-create-folder"
							on:click|preventDefault={() => {
								folder_form.reset();
								show_folder_form = false;
								form = undefined;
							}}>Cancel</button
						>
					</InputGroup>
				</InputRow>
			</form>
		</Card>
	</div>

	{#each inodes as inode (inode.id)}
		<Inode {...inode} />
	{/each}

	{#if !inodes.length}
		<p>empty</p>
	{/if}

	<Pagination {page} {first_item} {last_item} {amount_of_items} {amount_of_pages} />
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
</style>
