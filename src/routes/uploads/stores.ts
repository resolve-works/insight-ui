
import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { Upload } from './Upload.svelte';

export const uploads: Writable<Upload[]> = writable([]);

