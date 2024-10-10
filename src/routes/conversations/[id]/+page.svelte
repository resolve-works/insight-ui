<script lang="ts">
	import { tick, onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import Section from '$lib/Section.svelte';
	import SideBar from '$lib/SideBar.svelte';
	import Page from '$lib/Page.svelte';
	import Icon from '$lib/Icon.svelte';
	import FolderFilter from '$lib/FolderFilter.svelte';
	import Message, { MessageType } from './Message.svelte';
	import Sources from './Sources.svelte';
	import type { FolderOption } from '$lib/FolderFilter.svelte';
	import { breadcrumbs } from '$lib/stores';
	import ErrorMessage from '$lib/ErrorMessage.svelte';

	export let data;
	const { options, total, paths } = data;

	let create_conversation_form: HTMLFormElement;
	let answer_prompt_form: HTMLFormElement;
	let input: HTMLInputElement;
	let query: string;

	$: is_disabled = !!query || !!data.error;

	$: {
		breadcrumbs.set([{ name: 'Conversations', path: '/conversations' }]);
	}

	$: selected = options.filter((option: FolderOption) => paths.includes(option.key));

	async function answer_prompt() {
		query = input.value;
		answer_prompt_form.reset();
		scroll_to_bottom();

		return () => {
			query = '';
			invalidate('api:prompts');
			scroll_to_bottom();
			input.focus();
		};
	}

	// This is a chat, scroll to bottom
	async function scroll_to_bottom() {
		if (browser) {
			await tick();
			window.scrollTo(0, document.body.scrollHeight);
		}
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

			{#if query}
				<Message type={MessageType.human}>
					<p>{query}</p>
				</Message>

				<Message type={MessageType.machine}>
					<p><Icon test_id="message-loader" class="gg-loadbar" /></p>
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

		<form
			class="prompt"
			method="POST"
			action="?/answer_prompt"
			use:enhance={answer_prompt}
			bind:this={answer_prompt_form}
		>
			<input
				type="text"
				name="query"
				data-testid="query-input"
				placeholder="Your question ..."
				bind:this={input}
				disabled={is_disabled}
			/>
			<input
				type="number"
				name="similarity_top_k"
				data-testid="similarity-top-k-input"
				placeholder="Pages (default: 3) ..."
				min="0"
				disabled={is_disabled}
			/>
			<button class="primary" data-testid="create-prompt" disabled={is_disabled}>Prompt</button>
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
