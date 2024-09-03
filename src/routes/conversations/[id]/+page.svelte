<script lang="ts">
	import { browser } from '$app/environment';
	import { tick } from 'svelte';
	import { enhance } from '$app/forms';
	import Section from '$lib/Section.svelte';
	import SideBar from '$lib/SideBar.svelte';
	import Page from '$lib/Page.svelte';
	import Card from '$lib/Card.svelte';
	import Icon from '$lib/Icon.svelte';
	import FolderFilter from '$lib/FolderFilter.svelte';
	import type { FolderOption } from '$lib/FolderFilter.svelte';
	import { breadcrumbs } from '$lib/stores';

	export let data;
	const { options, paths } = data;

	let form: HTMLFormElement;

	$: {
		breadcrumbs.set([{ name: 'Conversations', path: '/conversations' }]);
	}

	$: selected = options.filter((option: FolderOption) => paths.includes(option.key));

	// This is a chat, scroll to bottom
	async function scroll_to_bottom() {
		if (browser) {
			await tick();
			window.scrollTo(0, document.body.scrollHeight);
		}
	}

	$: data && scroll_to_bottom();
</script>

<SideBar>
	<h2 slot="header">Filters</h2>

	<nav>
		<form action="/conversations?/create_conversation" method="POST" bind:this={form}>
			<Section>
				<p>Filter by folder</p>
				<FolderFilter
					{options}
					{selected}
					on:change={async () => {
						// Start a new conversation when the filters change
						await tick();
						form.submit();
					}}
				/>
			</Section>

			<button class="secondary" title="Start a new conversation with these filters">
				New Conversation
			</button>
		</form>
	</nav>
</SideBar>

<Page class="with-sidebar-left">
	<div class="chat">
		<div class="messages">
			<!--<div class="message machine">-->
			<!--<aside>-->
			<!--<h3>M</h3>-->
			<!--</aside>-->

			<!--<Card class="card">-->
			<!--<h3>Machine</h3>-->

			<!--<p>We are conversing about 16 files, what would you like to know about these files?</p>-->
			<!--</Card>-->
			<!--</div>-->

			{#each data.prompts as prompt}
				<div class="message human">
					<aside>
						<h3>H</h3>
					</aside>

					<Card class="card">
						<h3>Human</h3>

						<p>{prompt.query}</p>
					</Card>
				</div>

				<div class="message machine">
					<aside>
						<h3>M</h3>
					</aside>

					<Card class="card">
						<h3>Machine</h3>

						{#if prompt.response}
							<p>{prompt.response}</p>

							{#if prompt.sources.length}
								<p>
									{#each prompt.sources as source}
										<a href="/files/{source.id}?page={source.index - source.from_page + 1}">
											<span>
												<Icon class="gg-file" />
												{source.index - source.from_page + 1}
											</span>
											{source.name}
										</a>
									{/each}
								</p>
							{/if}
						{:else}
							<Icon class="gg-loadbar" />
						{/if}
					</Card>
				</div>
			{/each}
		</div>

		<form class="prompt" method="POST" action="?/answer_prompt" use:enhance={scroll_to_bottom}>
			<input type="text" name="query" placeholder="What's your question?" />
			<input type="number" name="similarity_top_k" placeholder="Pages (default: 3)" min="0" />
			<button class="primary">Prompt</button>
		</form>
	</div>
</Page>

<style>
	:root {
		--profile-size: 4rem;
		--profile-margin: 1rem;
		--triangle-size: 3rem;
	}

	.chat {
		display: grid;
		grid-template-rows: 1fr auto;
		min-height: 100%;
	}

	.messages {
		width: 100%;
	}

	.message {
		display: flex;
		gap: 2rem;
		margin-bottom: 1rem;
	}

	.message.human {
		flex-direction: row-reverse;
	}

	aside {
		display: grid;
		align-items: center;
		height: var(--profile-size);
		background: var(--color-primary);
		text-align: center;
		border-radius: 50%;
		color: var(--text-color-light);
		margin-top: var(--profile-margin);
		flex-basis: var(--profile-size);
		flex-shrink: 0;
		flex-grow: 0;
	}

	.message.machine aside {
		background: #6167c9;
	}

	:global(.card) {
		position: relative;
		max-width: 60rem;
	}

	:global(.card:before) {
		content: '';
		width: var(--triangle-size);
		height: var(--triangle-size);
		position: absolute;
		top: calc(var(--profile-margin) + (var(--profile-size) - var(--triangle-size)) / 2);
		border: calc(var(--triangle-size) / 2) solid transparent;
	}

	.message.machine :global(.card:before) {
		left: calc(var(--triangle-size) * -1);
		border-right-color: var(--color-white);
	}
	.message.human :global(.card:before) {
		right: calc(var(--triangle-size) * -1);
		border-left-color: var(--color-white);
	}

	form.prompt {
		display: grid;
		grid-template-columns: 4fr 1fr 1fr;
		align-items: center;
		gap: 0.5rem;
	}

	a {
		display: grid;
		align-items: center;
		grid-template-columns: 6rem auto;
	}

	span {
		display: grid;
		height: 2rem;
		grid-template-columns: 2rem auto;
		align-items: center;
		margin-right: 1rem;
	}
</style>
