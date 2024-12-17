<script lang="ts">
	import { run } from 'svelte/legacy';

	import { page } from '$app/stores';
	import { invalidate } from '$app/navigation';
	import { tick, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import Section from '$lib/Section.svelte';
	import SideBar from '$lib/SideBar.svelte';
	import Page from '$lib/Page.svelte';
	import FolderFilter from '$lib/FolderFilter.svelte';
	import Message, { MessageType } from './Message.svelte';
	import Sources from './Sources.svelte';
	import { breadcrumbs } from '$lib/stores';
	import ErrorMessage from '$lib/ErrorMessage.svelte';
	import Row from '$lib/Row.svelte';
	import FormErrors from '$lib/FormErrors.svelte';
	import type { Source } from './Answer.svelte';
	import Answer from './Answer.svelte';

	let { data, form } = $props();
	const { selected_folders } = data;

	let sources = $derived(data.prompts.map((prompt: { sources: Source[] }) => prompt.sources).flat());

	let filter_form: HTMLFormElement = $state();
	let input: HTMLInputElement = $state();
	let answer: string = $state('');

	run(() => {
		breadcrumbs.set([{ name: 'Conversations', path: '/conversations' }]);
	});

	// This is a chat, scroll to bottom
	async function scroll_to_bottom() {
		if (browser) {
			await tick();
			window.scrollTo(0, document.body.scrollHeight);
		}
	}

	async function generate_answer() {
		return async ({ update }: { update: Function }) => {
			await update();

			// Tick will force svelte to set `form`
			await tick();
			if (form && 'errors' in form) {
				return;
			}

			const url = new URL($page.url);
			url.pathname += '/answer';

			const decoder = new TextDecoder();

			const response = await fetch(url, { method: 'POST' });
			if (response.body) {
				const reader = response.body.getReader();
				while (true) {
					const { done, value } = await reader.read();
					if (done) {
						await invalidate('api:conversations');
						answer = '';
						input.focus();
						break;
					}
					answer += decoder.decode(value);
					await scroll_to_bottom();
				}
			}
		};
	}

	// Focus on input on load
	onMount(() => input.focus());

	// Scroll to bottom when data changes
	run(() => {
		data && scroll_to_bottom();
	});
</script>

<SideBar>
	{#snippet header()}
		<h2 >Filters</h2>
	{/snippet}

	<nav>
		<form bind:this={filter_form} action="/conversations?/create_conversation" method="POST">
			<Section>
				<FolderFilter selected={selected_folders} on:change={() => filter_form.requestSubmit()} />
			</Section>

			<button class="button secondary" title="Start a new conversation with these filters">
				New Conversation
			</button>
		</form>
	</nav>
</SideBar>

<Page class="with-sidebar-left">
	<div class="chat">
		<div class="messages">
			<Message type={MessageType.machine}>
				<p>
					We are having a conversation about {#if !selected_folders.length}all files{:else}the files
						contained in the chosen folders{/if}. To what question do you think these files hold the
					answer?
				</p>
			</Message>

			{#each data.prompts as prompt}
				<Message type={MessageType.human}>
					<p>{prompt.query}</p>

					{#if prompt.error}
						<ErrorMessage message={prompt.error} />
					{/if}

					<Sources sources={prompt.sources} />
				</Message>

				{#if prompt.response}
					<Message type={MessageType.machine}>
						<Answer {sources} response={prompt.response} />
					</Message>
				{/if}
			{/each}

			{#if answer}
				<Message type={MessageType.machine}>
					<div class="response" data-testid="streamed-answer">
						<Answer {sources} response={answer} />
					</div>
				</Message>
			{/if}

			{#if data.error}
				<Message type={MessageType.machine}>
					<ErrorMessage
						message="Maximum conversation context exceeded. Start a new conversation."
					/>
				</Message>
			{/if}
		</div>

		<form class="prompt" method="POST" action="?/create_prompt" use:enhance={generate_answer}>
			<Row>
				<div class="prompt">
					<input
						type="text"
						name="query"
						data-testid="query-input"
						placeholder="Your question ..."
						bind:this={input}
					/>

					<FormErrors errors={form?.errors} key="query" />
				</div>

				<div class="similarity">
					<input
						type="number"
						name="similarity_top_k"
						data-testid="similarity-top-k-input"
						placeholder="Pages (default: 3) ..."
						min="0"
					/>

					<FormErrors errors={form?.errors} key="similarity_top_k" />
				</div>

				<button class="button primary" data-testid="create-prompt">Prompt</button>
			</Row>
		</form>
	</div>
</Page>

<style>
	.chat {
		display: grid;
		grid-template-rows: 1fr auto;
		min-height: 100%;
	}

	.prompt {
		flex-grow: 5 !important;
	}

	.prompt input {
		width: 100%;
	}

	.similarity {
		max-width: 15rem;
	}

	nav button {
		min-width: 100%;
		justify-content: center;
	}

	nav {
		/* https://css-tricks.com/flexbox-truncated-text/ */
		min-width: 0;
	}
</style>
