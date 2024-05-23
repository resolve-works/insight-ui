
import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { UUID } from 'crypto';

export type Upload = { id: UUID, file: File }

export const uploads: Writable<Upload[]> = writable([]);

