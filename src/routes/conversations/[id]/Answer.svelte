<script lang="ts" context="module">
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
	import SourceComponent from './Source.svelte';
	import { marked } from 'marked';

	export let response: string;
	export let sources: Source[];

	let source_links: SourceLink[] = [];
	let parsed_response = '';

	$: {
		source_links = [];
		parsed_response = response.replaceAll(/\[([^\]]+)\]\(([^\)]+)\)/g, (_, source_index, quote) => {
			// LLM answers with links to quotes in the form of
			// [source_index]("quote"). Transform these into links to sources
			const source = sources[source_index];
			const url = `/files/${source.id}?page=${source.index + 1}&query=${encodeURIComponent(quote)}`;
			source_links = [...source_links, { url, source }];
			const link = `[\[${source_links.length}\]](${url})`;
			return link;
		});
	}
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

<style>
	a {
		display: grid;
		align-items: center;
		gap: 0.5rem;
		grid-template-columns: 2rem auto;
	}
</style>
