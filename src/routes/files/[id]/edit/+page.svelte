<script lang="ts">
	import { enhance } from '$app/forms';
	import Page from '$lib/Page.svelte';
	import Card from '$lib/Card.svelte';
	import Unnamed from '$lib/Unnamed.svelte';
	import Section from '$lib/Section.svelte';
	import Title from '$lib/Title.svelte';
	import FormErrors from '$lib/FormErrors.svelte';
	import Form from '$lib/Form.svelte';
	import Breadcrumbs from '$lib/Breadcrumbs.svelte';
	import LoadingButton from '$lib/LoadingButton.svelte';

	let { data, form } = $props();
	let { ancestors } = $derived(data);

	let is_loading = $state(false);

	const breadcrumbs = $derived([
		{ name: 'Files', path: '/files' },
		...ancestors.map((ancestor: Record<string, string>) => {
			return {
				name: ancestor.name,
				path: `/files/${ancestor.id}`
			};
		}),
		{ name: data.name, path: `/files/${data.id}` },
		{ name: 'Edit', path: `/files/${data.id}/edit` }
	]);
</script>

<Page>
	{#snippet header()}
		<Breadcrumbs {breadcrumbs} />
	{/snippet}

	<Section>
		<Title>
			{#if data.name}
				Edit "{data.name}"
			{:else}
				Edit "<Unnamed />"
			{/if}
		</Title>

		<Card>
			<form
				method="POST"
				action="?/update"
				use:enhance={() => {
					is_loading = true;
					return async ({ update }) => {
						update({ reset: false });
						is_loading = false;
					};
				}}
			>
				<Form icon={data.type == 'file' ? 'gg-file-document' : 'gg-folder'}>
					<input
						type="text"
						name="name"
						placeholder="File name"
						value={data.name}
						data-testid="inode-name-input"
					/>

					<FormErrors errors={form?.errors} key="name" />

					<label title="A public folder can be viewed by everyone">
						<input
							type="checkbox"
							name="is_public"
							data-testid="inode-is-public-input"
							checked={data.is_public}
						/>
						This is a public {data.type == 'file' ? 'document' : 'folder'}
					</label>

					<FormErrors errors={form?.errors} key="is_public" />

					<LoadingButton
						label={`Update ${data.type == 'file' ? 'Document' : 'Folder'}`}
						{is_loading}
						test_id={'update-inode'}
					/>
				</Form>
			</form>
		</Card>
	</Section>
</Page>
