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
	import ErrorMessage from '$lib/ErrorMessage.svelte';
	import SourceComponent from './Source.svelte';
	import { marked } from 'marked';

	interface Props {
		response: string;
		sources: Source[];
	}

	let { response, sources }: Props = $props();

	const regex = /\[([^\]]+)\]\(([^\)]+)\)/g;

	const parsed: { links: SourceLink[]; text: string; missing: number } = $derived.by(() => {
		const links: SourceLink[] = [];
		let missing = 0;
		// Replace the LLM generated source links with actual links, update the
		// `links` array so we can show all source links at the bottom
		// of an answer
		const text = response.replaceAll(regex, (_, source_index, quote) => {
			// LLM answers with links to quotes in the form of
			// [source_index]("quote"). Transform these into links to sources
			try {
				const source = sources[source_index];
				// Strip quotes
				const query = encodeURIComponent(quote.trim().replace(/^"(.+)"$/, '$1'));
				const url = `/files/${source.id}?page=${source.index + 1}&query=${query}`;
				links.push({ url, source });
				const link = `[\[${links.length}\]](${url})`;
				return link;
			} catch {
				missing += 1;
				return ``;
			}
		});

		return { text, links, missing };
	});
</script>

{@html marked.parse(parsed.text)}

{#if parsed.links.length}
	<p>
		{#each parsed.links as link, index}
			<a href={link.url}>
				[{index + 1}]:
				<SourceComponent {...link.source} />
			</a>
		{/each}
	</p>
{/if}

{#if parsed.missing}
	<ErrorMessage
		message={`${parsed.missing} citations are missing source${parsed.missing != 1 ? 's' : ''}, files have been deleted.`}
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
