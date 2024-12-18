<script lang="ts" module>
	export type Source = {
		index: number;
		id: string;
		name: string;
		from_page: number;
	};

	export type SourceLink = {
		url: string;
		source: Source;
	};
</script>

<script lang="ts">
	import { run } from 'svelte/legacy';

	import ErrorMessage from '$lib/ErrorMessage.svelte';
	import SourceComponent from './Source.svelte';
	import { marked } from 'marked';

	interface Props {
		response: string;
		sources: Source[];
	}

	let { response, sources }: Props = $props();

	const regex = /\[([^\]]+)\]\(([^\)]+)\)/g;

	let sources_missing: number = $state(0);
	let parsed_response = $state('');

	let source_links: SourceLink[] = $state([]);

	run(() => {
		source_links = [];
		sources_missing = 0;
		// WARNING - this function has sides effects, next to replacing the LLM
		// generated source links with actual links, it updates the
		// `source_links` array so we can show all source links at the bottom
		// of an answer
		parsed_response = response.replaceAll(regex, (_, source_index, quote) => {
			// LLM answers with links to quotes in the form of
			// [source_index]("quote"). Transform these into links to sources
			try {
				const source = sources[source_index];
				// Strip quotes
				const query = encodeURIComponent(quote.trim().replace(/^"(.+)"$/, '$1'));
				const url = `/files/${source.id}?page=${source.index + 1}&query=${query}`;
				source_links = [...source_links, { url, source }];
				const link = `[\[${source_links.length}\]](${url})`;
				return link;
			} catch {
				sources_missing += 1;
				return ``;
			}
		});
	});
</script>

{@html marked.parse(parsed_response)}

{#if source_links.length}
	<p>
		{#each source_links as link, index}
			<a href={link.url}>
				[{index + 1}]:
				<SourceComponent {...link.source} />
			</a>
		{/each}
	</p>
{/if}

{#if sources_missing}
	<ErrorMessage
		message={`${sources_missing} citations are missing source${sources_missing != 1 ? 's' : ''}, files have been deleted.`}
	/>
{/if}

<style>
	a {
		display: grid;
		align-items: center;
		gap: 0.5rem;
		grid-template-columns: 2rem auto;
	}
</style>
