export type UploadState = {
	id: string;
	parent_id: string | undefined;
	file: File;
	// https://github.com/whatwg/fetch/issues/607
	// Fetch doesn't allow tracking progress for now
	xhr: XMLHttpRequest;
	// Track progress
	total: number;
	loaded: number;
	error: string | undefined;
	is_started: boolean;
};

export const uploads: UploadState[] = $state([]);
