export function parse_folders(param: string | null) {
	if (!param) {
		return [];
	}

	try {
		const folders = JSON.parse(param);
		if (!Array.isArray(folders)) {
			throw Error('Expected array');
		}

		if (!folders.every((f) => typeof f == 'string' && f.at(0) == '/')) {
			throw Error('Expected array of paths starting with "/"');
		}

		return folders;
	} catch (_) {
		return [];
	}
}
