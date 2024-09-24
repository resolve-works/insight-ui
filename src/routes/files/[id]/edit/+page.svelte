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
				<div class="icon">
					<Icon class={data.files ? 'gg-file-document' : 'gg-folder'} />
				</div>

				<div class="input">
					<input
						type="text"
						name="name"
						placeholder="File name"
						value={data.name}
						data-testid="inode-name-input"
					/>

					<FormErrors errors={form?.errors} key="name" />
				</div>

				<button class="primary" data-testid="change-inode-name">
					<Icon class="gg-pen" /> Change name
				</button>
			</form>
		</Card>
	</Section>
</Page>

<style>
	.icon {
		margin: var(--input-padding-y) 0;
	}

	form {
		display: flex;
		align-items: start;
		gap: 1rem;
		margin: 0.5rem 0;
	}

	.input {
		flex-grow: 1;
	}

	.input input {
		width: 100%;
	}
</style>
