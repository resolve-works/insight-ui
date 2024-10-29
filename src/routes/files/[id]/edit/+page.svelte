<script lang="ts">
	import { enhance } from '$app/forms';
	import Page from '$lib/Page.svelte';
	import Icon from '$lib/Icon.svelte';
	import Card from '$lib/Card.svelte';
	import Unnamed from '$lib/Unnamed.svelte';
	import Section from '$lib/Section.svelte';
	import { breadcrumbs } from '$lib/stores';
	import Title from '$lib/Title.svelte';
	import FormErrors from '$lib/FormErrors.svelte';
	import Form from '$lib/Form.svelte';

	export let data;
	export let form;

	$: {
		breadcrumbs.set([
			{ name: 'Uploads', path: '/files' },
			...data.ancestors.map((ancestor: Record<string, string>) => {
				return {
					name: ancestor.name,
					path: `/files/${ancestor.id}`
				};
			}),
			{ name: data.name, path: `/files/${data.id}` },
			{ name: 'Edit', path: `/files/${data.id}/edit` }
		]);
	}
</script>

<Page>
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
				use:enhance={() =>
					async ({ update }) =>
						update({ reset: false })}
			>
				<Form icon={data.files ? 'gg-file-document' : 'gg-folder'}>
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
						This is a public {data.files ? 'document' : 'folder'}
					</label>

					<FormErrors errors={form?.errors} key="is_public" />

					<button class="primary" data-testid="update-inode">
						<Icon class="gg-pen" /> Update {data.files ? 'Document' : 'Folder'}
					</button>
				</Form>
			</form>
		</Card>
	</Section>
</Page>
