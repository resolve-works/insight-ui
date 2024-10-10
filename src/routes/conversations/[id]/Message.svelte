<script lang="ts" context="module">
	export enum MessageType {
		machine,
		human
	}
</script>

<script lang="ts">
	import Card from '$lib/Card.svelte';
	export let type: MessageType;

	const type_class = MessageType[type];
	const name = type_class.charAt(0).toUpperCase() + type_class.slice(1);
</script>

<div class={`message ${type_class}`} data-testid={`${type_class}-message`}>
	<h3 class="profile">{name.slice(0, 1)}</h3>

	<Card class="card">
		<h3>{name}</h3>

		<slot />
	</Card>
</div>

<style>
	:root {
		--profile-size: 4rem;
		--profile-margin: 1rem;
		--triangle-size: 3rem;
	}

	.message {
		display: flex;
		gap: 2rem;
		margin-bottom: 1rem;
	}

	.message.human {
		flex-direction: row-reverse;
	}

	.profile {
		display: grid;
		align-items: center;
		height: var(--profile-size);
		background: var(--color-primary);
		text-align: center;
		border-radius: 50%;
		color: var(--text-color-light);
		margin-top: var(--profile-margin);
		flex-basis: var(--profile-size);
		flex-shrink: 0;
		flex-grow: 0;
	}

	.message.machine .profile {
		background: #6167c9;
	}

	:global(.card) {
		position: relative;
		max-width: 60rem;
	}

	:global(.card:before) {
		content: '';
		width: var(--triangle-size);
		height: var(--triangle-size);
		position: absolute;
		top: calc(var(--profile-margin) + (var(--profile-size) - var(--triangle-size)) / 2);
		border: calc(var(--triangle-size) / 2) solid transparent;
	}

	.message.machine :global(.card:before) {
		left: calc(var(--triangle-size) * -1);
		border-right-color: var(--color-white);
	}
	.message.human :global(.card:before) {
		right: calc(var(--triangle-size) * -1);
		border-left-color: var(--color-white);
	}
</style>
