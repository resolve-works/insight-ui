<script lang="ts">
	import { page } from '$app/stores';
	import { tick, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import Section from '$lib/Section.svelte';
	import SideBar from '$lib/SideBar.svelte';
	import Page from '$lib/Page.svelte';
	import FolderFilter from '$lib/FolderFilter.svelte';
	import Message, { MessageType } from './Message.svelte';
	import Sources from './Sources.svelte';
	import type { FolderOption } from '$lib/FolderFilter.svelte';
	import { breadcrumbs } from '$lib/stores';
	import ErrorMessage from '$lib/ErrorMessage.svelte';

	export let data;
	export let form;
	const { options, total, paths } = data;

	let create_conversation_form: HTMLFormElement;
	let input: HTMLInputElement;
	let answer: string = '';

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

	async function generate_answer() {
		return async ({ result, update }) => {
			await update();

			const url = new URL($page.url);
			url.pathname += '/answer';

			const decoder = new TextDecoder('utf-8');

			const response = await fetch(url, { method: 'POST' });
			if (response.body) {
				const reader = response.body.getReader();
				while (true) {
					const { done, value } = await reader.read();
					if (done) {
						break;
					}

					const chunk = decoder.decode(value);
					const lines = chunk.split('\n\n');
					const parsedLines = lines
						.map((line) => line.replace(/^data: /, '').trim()) // Remove the "data: " prefix
						.filter((line) => line !== '' && line !== '[DONE]') // Remove empty lines and "[DONE]"
						.map((line) => JSON.parse(line)); // Parse the JSON string

					for (const parsedLine of parsedLines) {
						const { choices } = parsedLine;
						const { delta } = choices[0];
						const { content } = delta;
						// Update the UI with the new content
						if (content) {
							answer += content;
						}
					}
				}
			}
		};
	}

	// Focus on input on load
	onMount(() => input.focus());

	// Scroll to bottom when data changes
	$: data && scroll_to_bottom();
</script>

<SideBar>
	<h2 slot="header">Filters</h2>

	<nav>
		<form
			action="/conversations?/create_conversation"
			method="POST"
			bind:this={create_conversation_form}
		>
			<Section>
				<p>Filter by folder</p>
				<FolderFilter
					{options}
					{selected}
					on:change={async () => {
						// Start a new conversation when the filters change
						await tick();
						create_conversation_form.submit();
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
			<Message type={MessageType.machine}>
				<p>
					We are conversing about {total} file{#if total != 1}s{/if}.

					{#if !selected.length}
						You can narrow the context of our conversation with the filters.
					{/if}

					To what question do you think these files hold the answer?
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
						<p class="response">{prompt.response}</p>
					</Message>
				{/if}
			{/each}

			{#if answer}
				<Message type={MessageType.machine}>
					<p class="response">{answer}</p>
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
			<input
				type="text"
				name="query"
				data-testid="query-input"
				placeholder="Your question ..."
				bind:this={input}
			/>
			<input
				type="number"
				name="similarity_top_k"
				data-testid="similarity-top-k-input"
				placeholder="Pages (default: 3) ..."
				min="0"
			/>
			<button class="primary" data-testid="create-prompt">Prompt</button>
		</form>
	</div>
</Page>

<style>
	.chat {
		display: grid;
		grid-template-rows: 1fr auto;
		min-height: 100%;
	}

	form.prompt {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	form.prompt input[type='text'] {
		flex-grow: 1;
	}

	.response {
		white-space: pre-wrap;
	}
</style>
