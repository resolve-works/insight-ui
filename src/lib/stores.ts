
import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { Upload } from './Upload.svelte';
import type { Breadcrumb } from './Breadcrumbs.svelte';

export const uploads: Writable<Upload[]> = writable([]);

export const breadcrumbs: Writable<Breadcrumb[]> = writable([]);
