export const PAGE_SIZE = 30;

export function parse_content_range(content_range: string | null) {
	if (!content_range) {
		throw new Error('Content-range header not set');
	}
	const [item_range, total] = content_range.split('/');
	const amount_of_items = parseInt(total);
	const [first_item, last_item] = amount_of_items
		? item_range.split('-').map((i) => parseInt(i))
		: [undefined, undefined];
	const amount_of_pages = Math.ceil(amount_of_items / PAGE_SIZE);

	return { first_item, last_item, amount_of_items, amount_of_pages };
}

export function calculate_pagination(amount_of_items: number, page: number) {
	const first_item = (page - 1) * PAGE_SIZE;
	const last_page_item = page * PAGE_SIZE;
	const last_item = (last_page_item < amount_of_items ? last_page_item : amount_of_items) - 1;

	return {
		page,
		first_item,
		last_item,
		amount_of_items,
		amount_of_pages: Math.ceil(amount_of_items / PAGE_SIZE)
	};
}
