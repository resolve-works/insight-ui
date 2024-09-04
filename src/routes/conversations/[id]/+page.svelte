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
    import Message from `./Message.svelte`;
	import type { FolderOption } from '$lib/FolderFilter.svelte';
	import { breadcrumbs } from '$lib/stores';

	export let data;
	const { options, total, paths } = data;

	let form: HTMLFormElement;
	let query: string;
	let is_answering = false;
    let input: HTMLInputElement;

	$: {
		breadcrumbs.set([{ name: 'Conversations', path: '/conversations' }]);
	}

	$: selected = options.filter((option: FolderOption) => paths.includes(option.key));

    async function answer_prompt() {
        is_answering = true;
        scroll_to_bottom()

        return () => {
            is_answering = false;
            query = "";
            invalidate('api:prompts')
            scroll_to_bottom()
            input.focus();
        }
    }

	// This is a chat, scroll to bottom
	async function scroll_to_bottom() {
		if (browser) {
			await tick();
			window.scrollTo(0, document.body.scrollHeight);
		}
	}

    // Focus on input on load
    onMount(() => input.focus())

	// Scroll to bottom when data changes
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
			<Message class="machine" name="Machine">
				<p>
					We are conversing about {total} files.

					{#if !selected.length}
						You can narrow the context of our conversation with the filters.
					{/if}

					To what question do you think these files hold the answer?
				</p>
			</Message>

			{#each data.prompts as prompt}
				<Message class="human" name="Human">
					<p>{prompt.query}</p>
				</Message>

				<Message class="machine" name="Machine">
					{#if prompt.response}
						<p class="response">{prompt.response}</p>

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
						<p><Icon class="gg-loadbar" /></p>
					{/if}
				</Message>
			{/each}

			{#if is_answering}
				<Message class="human" name="Human">
					<p>{query}</p>
				</Message>

				<Message class="machine" name="Machine">
					<p><Icon class="gg-loadbar" /></p>
				</Message>
			{/if}
		</div>

		<form class="prompt" method="POST" action="?/answer_prompt" use:enhance={answer_prompt}>
			<input
				type="text"
				name="query"
				placeholder="Your question ..."
				bind:this={input}
				bind:value={query}
				disabled={is_answering}
			/>
			<input
				type="number"
				name="similarity_top_k"
				placeholder="Pages (default: 3) ..."
				min="0"
				disabled={is_answering}
			/>
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
