<script lang="ts">
	import { tick } from 'svelte';
	import InputGroup from '$lib/InputGroup.svelte';
	import Card from '$lib/Card.svelte';
	import { onMount } from 'svelte';
	import Icon from '$lib/Icon.svelte';
	import Page from '$lib/Page.svelte';
	import Inode from '$lib/Inode.svelte';
	import Upload from '$lib/Upload.svelte';
	import Unnamed from '$lib/Unnamed.svelte';
	import Title from '$lib/Title.svelte';
	import Section from '$lib/Section.svelte';
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { uploads } from '$lib/upload.svelte';
	import type { UploadState } from '$lib/upload.svelte';
	import Pagination from '$lib/Pagination.svelte';
	import Form from '$lib/Form.svelte';
	import FormErrors from '$lib/FormErrors.svelte';
	import Row from '$lib/Row.svelte';
	import type { Breadcrumb } from '$lib/Breadcrumbs.svelte';
	import Breadcrumbs from '$lib/Breadcrumbs.svelte';
	import LoadingButton from '$lib/LoadingButton.svelte';

	interface Props {
		breadcrumbs: Breadcrumb[];
		name: string;
		is_owned?: boolean;
		users?: { name: string } | undefined;
		inodes: any;
		form: any;
		parent_id?: number | undefined;
		path?: string | undefined;
		page: any;
		first_item: number | undefined;
		last_item: number | undefined;
		amount_of_items: number;
		amount_of_pages: number;
	}

	let {
		name,
		breadcrumbs = [],
		is_owned = true,
		users = undefined,
		inodes,
		form = $bindable(),
		parent_id = undefined,
		path = undefined,
		page,
		first_item,
		last_item,
		amount_of_items,
		amount_of_pages
	}: Props = $props();

	const PARALLEL_UPLOADS = 3;

	// Dragevents trigger on every element. Keep track of how many bubbled up to stop drag on window leave
	let counter = $state(0);
	let files_input: HTMLInputElement;
	let files_form: HTMLFormElement;

	let folder_input: HTMLInputElement;
	let folder_form: HTMLFormElement;
	let show_folder_form = $state(false);
	let is_loading = $state(false);

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
		e.preventDefault();
		const form_data = new FormData(e.target as HTMLFormElement);
		const files = form_data.getAll('files') as File[];
		const parent_id = form_data.get('parent_id') as string;
		for (const file of files) {
			const upload: UploadState = {
				id: self.crypto.randomUUID(),
				parent_id,
				file,
				total: file.size,
				loaded: 0,
				xhr: new XMLHttpRequest(),
				is_started: false,
				error: undefined
			};

			uploads.push(upload);
		}
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

	function discard_upload(upload: UploadState) {
		uploads.splice(uploads.indexOf(upload), 1);
	}

	$effect(() => {
		const slice = uploads.filter((upload) => upload.error == undefined).slice(0, PARALLEL_UPLOADS);

		// Start unstarted uploads
		for (const upload of slice) {
			// Start active uploads that have not been started yet.
			if (!upload.is_started) {
				upload.is_started = true;

				upload.xhr.upload.addEventListener('progress', (e: ProgressEvent) => {
					upload.loaded = e.loaded;
					upload.total = e.total;
				});

				upload.xhr.addEventListener('loadend', (e: ProgressEvent) => {
					if (upload.xhr.status == 200) {
						invalidate('api:inodes');
						discard_upload(upload);
					} else {
						const data = JSON.parse(upload.xhr.response);
						upload.error = data.message;
					}
				});

				const data = new FormData();
				data.append('file', upload.file);
				if (upload.parent_id) {
					data.append('parent_id', upload.parent_id);
				}

				upload.xhr.open('POST', `/files/upload`, true);
				upload.xhr.send(data);
			}
		}
	});

	let started = $derived(uploads.filter((upload) => upload.is_started));
	let pending = $derived(uploads.filter((upload) => !upload.is_started));
</script>

{#snippet header()}
	<Breadcrumbs {breadcrumbs} />
{/snippet}

<Page {header}>
	{#if started.length > 0}
		<Section>
			<h3>Uploading...</h3>
			{#each started as upload (upload.id)}
				<Upload
					name={upload.file.name}
					error={upload.error}
					discard_upload={() => discard_upload(upload)}
					loaded={upload.loaded}
					total={upload.total}
				/>
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

		{#snippet actions()}
			<InputGroup>
				{#if !is_owned}
					<span class="shared">Shared by {users.name}</span>
				{/if}

				<form bind:this={files_form} onsubmit={create_uploads}>
					<input
						name="files"
						data-testid="files-input"
						type="file"
						accept=".pdf"
						multiple
						bind:this={files_input}
						onchange={() => files_form.requestSubmit()}
					/>
					{#if parent_id}
						<input name="parent_id" type="hidden" value={parent_id} />
					{/if}

					<button
						class="button"
						onclick={(e) => {
							e.preventDefault();
							files_input.click();
						}}
					>
						<Icon class="gg-software-upload" />
						Upload PDFs
					</button>
				</form>

				<button
					onclick={async (e) => {
						e.preventDefault();
						show_folder_form = true;
						await tick();
						folder_input.focus();
					}}
					data-testid="show-folder-form"
					class="button"
				>
					<Icon class="gg-folder-add" />
					Create Folder
				</button>

				<form action="/conversations?/create_conversation" method="POST">
					<input type="hidden" name="folders" value={JSON.stringify(path ? [path] : [])} />

					<button
						title="Start conversation about the files in this folder"
						data-testid="start-conversation"
						class="button"
					>
						<Icon class="gg-comment" />
						Start Conversation
					</button>
				</form>
			</InputGroup>
		{/snippet}
	</Title>

	<h2 class="drop-message" class:dragover={counter > 0}>
		<Icon class="gg-software-upload" />
		Drop PDF files to upload
	</h2>

	<div class="create-folder" class:visible={show_folder_form || form?.errors}>
		<Card>
			<form
				class="create-folder-form"
				data-testid="create-folder-form"
				method="POST"
				action="?/create_folder"
				use:enhance={() => {
					is_loading = true;
					return async ({ update }) => {
						await update();
						invalidate('api:inodes');
						show_folder_form = false;
						is_loading = false;
					};
				}}
				bind:this={folder_form}
			>
				{#if parent_id}
					<input name="parent_id" type="hidden" value={parent_id} />
				{/if}

				<Form icon="gg-folder">
					<Row>
						<div class="input">
							<input
								disabled={is_loading}
								name="name"
								data-testid="folder-name-input"
								placeholder="Folder name"
								bind:this={folder_input}
							/>

							<FormErrors errors={form?.errors} key="name" />
						</div>

						<InputGroup>
							<LoadingButton {is_loading} label={'Create'} test_id="create-folder" />

							<button
								class="button"
								data-testid="cancel-create-folder"
								onclick={(e) => {
									e.preventDefault();
									folder_form.reset();
									show_folder_form = false;
									form = undefined;
								}}>Cancel</button
							>
						</InputGroup>
					</Row>
				</Form>
			</form>
		</Card>
	</div>

	{#each inodes as inode (inode.id)}
		<Inode {...inode} />
	{/each}

	{#if !inodes.length}
		<p class="empty">This folder is empty.</p>
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

	.create-folder .input {
		flex-grow: 1;
	}

	.create-folder .input input {
		width: 100%;
	}

	.create-folder.visible {
		display: block;
	}

	.shared {
		margin-right: 1rem;
		color: var(--text-color-page);
	}

	.empty {
		color: var(--text-color-page);
	}
</style>
