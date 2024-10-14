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
	import Message, { MessageType } from './Message.svelte';
	import Sources from './Sources.svelte';
	import type { FolderOption } from '$lib/FolderFilter.svelte';
	import { breadcrumbs } from '$lib/stores';
	import ErrorMessage from '$lib/ErrorMessage.svelte';
	import InputRow from '$lib/InputRow.svelte';
	import FormErrors from '$lib/FormErrors.svelte';
	import { marked } from 'marked';

	export let data;
	export let form;
	const { options, total, paths } = data;

	$: sources = data.prompts
		.map((prompt: { sources: Record<string, any>[] }) => prompt.sources)
		.flat();

	let create_conversation_form: HTMLFormElement;
	let input: HTMLInputElement;
	let answer: string = '';

	$: {
		breadcrumbs.set([{ name: 'Conversations', path: '/conversations' }]);
	}

	$: selected = options.filter((option: FolderOption) => paths.includes(option.key));

	function expand_quote_links(answer: string) {
		let links = [];

		return answer.replaceAll(/\[([^\]]+)\]\(([^\)]+)\)/g, (_, source_index, quote) => {
			// LLM answers with links to quotes in the form of
			// [source_index]("quote"). Transform these into links to sources
			const source = sources[source_index];
			const url = `/files/${source.id}?page=${source.index + 1}&query=${encodeURIComponent(quote)}`;
			links.push({
				url,
				source
			});
			const link = `[\[${links.length}\]](${url})`;
			return link;
		});
	}

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
						<p class="response">{@html marked.parse(expand_quote_links(prompt.response))}</p>
					</Message>
				{/if}
			{/each}

			{#if answer}
				<Message type={MessageType.machine}>
					<div class="response" data-testid="streamed-answer">
						{@html marked.parse(expand_quote_links(answer))}
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
			<InputRow>
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

				<button class="primary" data-testid="create-prompt">Prompt</button>
			</InputRow>
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

	.similarity {
		max-width: 15rem;
	}
</style>
