
export const PAGE_SIZE = 50

export function parse_content_range(content_range: string | null) {
    if (!content_range) {
        throw new Error('Content-range header not set')
    }
    const [item_range, total] = content_range.split('/')
    const amount_of_items = parseInt(total)
    const [first_item, last_item] = amount_of_items
        ? item_range.split('-').map(i => parseInt(i))
        : [undefined, undefined]
    const amount_of_pages = Math.ceil(amount_of_items / PAGE_SIZE)

    return {first_item, last_item, amount_of_items, amount_of_pages}
}

