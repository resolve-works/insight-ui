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

	const source_links: SourceLink[] = [];

	$: parsed_response = response.replaceAll(
		/\[([^\]]+)\]\(([^\)]+)\)/g,
		(_, source_index, quote) => {
			// LLM answers with links to quotes in the form of
			// [source_index]("quote"). Transform these into links to sources
			const source = sources[source_index];
			const url = `/files/${source.id}?page=${source.index + 1}&query=${encodeURIComponent(quote)}`;
			source_links.push({
				url,
				source
			});
			const link = `[\[${source_links.length}\]](${url})`;
			return link;
		}
	);
</script>

{@html marked.parse(parsed_response)}

{#if source_links.length}
	<p>
		{#each source_links as link, index}
			<div class="link">
				<span>[{index + 1}]:</span>
				<SourceComponent {...link.source} url={link.url} />
			</div>
		{/each}
	</p>
{/if}

<style>
	.link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
</style>
