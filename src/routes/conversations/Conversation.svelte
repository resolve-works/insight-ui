<script lang="ts">
	import Actionable from '$lib/Actionable.svelte';

	export let id;
	export let created_at;
</script>

<Actionable
	name={new Date(created_at).toLocaleString('en-US', { hour12: false })}
	path={`/conversations/${id}`}
	icon="gg-comment"
></Actionable>
