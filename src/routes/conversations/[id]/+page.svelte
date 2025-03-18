<script lang="ts">
	import { page } from '$app/stores';
	import { invalidate } from '$app/navigation';
	import { tick, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import Section from '$lib/Section.svelte';
	import SideBar from '$lib/SideBar.svelte';
	import Page from '$lib/Page.svelte';
	import FolderFilter from '$lib/FolderFilter.svelte';
	import Message from './Message.svelte';
	import Sources from './Sources.svelte';
	import ErrorMessage from '$lib/ErrorMessage.svelte';
	import Row from '$lib/Row.svelte';
	import FormErrors from '$lib/FormErrors.svelte';
	import type { Source } from './Answer.svelte';
	import Answer from './Answer.svelte';
	import Breadcrumbs from '$lib/Breadcrumbs.svelte';
	import LoadingButton from '$lib/LoadingButton.svelte';

	let { data, form } = $props();
	const { folders } = data;

	let sources = $derived(
		data.prompts.map((prompt: { sources: Source[] }) => prompt.sources).flat()
	);

	let filter_form: HTMLFormElement;
	let input: HTMLInputElement;
	let answer: string = $state('');
	let is_loading = $state(false);

	const breadcrumbs = [{ name: 'Conversations', path: '/conversations' }];

	// This is a chat, scroll to bottom
	async function scroll_to_bottom() {
		if (browser) {
			await tick();
			window.scrollTo(0, document.body.scrollHeight);
		}
	}

	async function generate_answer() {
		is_loading = true;

		return async ({ update }: { update: Function }) => {
			await update();

			// Tick will force svelte to set `form`
			await tick();
			if (form && 'errors' in form) {
				return;
			}

			// Post to ./answer route to stream answer
			const url = new URL($page.url);
			url.pathname += '/answer';

			const decoder = new TextDecoder();

			const response = await fetch(url, { method: 'POST' });
			if (response.body) {
				// Answer is streamed
				const reader = response.body.getReader();
				while (true) {
					const { done, value } = await reader.read();
					// If the reader is done, we should refetch the conversation from stored state
					if (done) {
						await invalidate('api:conversations');
						answer = '';
						is_loading = false;
						input.focus();
						break;
					}
					// Add streamed chunk to answer and scroll
					answer += decoder.decode(value);
					await scroll_to_bottom();
				}
			}
		};
	}

	// Focus on input on load
	onMount(() => input.focus());

	// Scroll to bottom when data changes
	$effect(() => {
		data && scroll_to_bottom();
	});
</script>

<Page>
	{#snippet header()}
		<Breadcrumbs {breadcrumbs} />
	{/snippet}

	{#snippet sidebar()}
		<SideBar>
			{#snippet header()}
				<h2>Filters</h2>
			{/snippet}

			<nav>
				<form bind:this={filter_form} action="?/update_filters" method="POST" use:enhance>
					<Section>
						<FolderFilter selected={folders} onchange={() => filter_form.requestSubmit()} />
					</Section>

					<button
						formaction="/conversations?/create_conversation"
						class="button secondary"
						title="Start a new conversation with these filters"
					>
						New Conversation
					</button>
				</form>
			</nav>
		</SideBar>
	{/snippet}

	<div class="chat">
		<div class="messages">
			<Message type={'machine'}>
				<p>
					We are having a conversation about {#if !folders.length}all files{:else}the files
						contained in the chosen folders{/if}. To what question do you think these files hold the
					answer?
				</p>
			</Message>

			{#each data.prompts as prompt}
				<Message type={'human'}>
					<p>{prompt.query}</p>

					{#if prompt.error}
						<ErrorMessage message={prompt.error} />
					{/if}

					<Sources sources={prompt.sources} />
				</Message>

				{#if prompt.response}
					<Message type={'machine'}>
						<Answer {sources} response={prompt.response} />
					</Message>
				{/if}
			{/each}

			{#if answer}
				<Message type={'machine'}>
					<div class="response" data-testid="streamed-answer">
						<Answer {sources} response={answer} />
					</div>
				</Message>
			{/if}

			{#if data.error}
				<Message type={'machine'}>
					<ErrorMessage
						message="Maximum conversation context exceeded. Start a new conversation."
					/>
				</Message>
			{/if}
		</div>

		<form class="prompt" method="POST" action="?/create_prompt" use:enhance={generate_answer}>
			<input type="hidden" name="folders" value={JSON.stringify(folders)} />

			<Row>
				<div class="prompt">
					<input
						type="text"
						name="query"
						data-testid="query-input"
						placeholder="Your question ..."
						bind:this={input}
						disabled={is_loading}
					/>

					<FormErrors errors={form?.errors} key="query" />
				</div>

				<div class="amount">
					<input
						type="number"
						name="amount"
						data-testid="amount-input"
						placeholder="Pages (default: 3) ..."
						min="0"
						disabled={is_loading}
					/>

					<FormErrors errors={form?.errors} key="amount" />
				</div>

				<LoadingButton {is_loading} label="Prompt" test_id="create-prompt" />
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

	.amount {
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
