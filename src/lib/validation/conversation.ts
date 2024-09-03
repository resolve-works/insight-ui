
import {z} from 'zod';
import {ssp} from 'sveltekit-search-params';

export const schema = z.object({
    folders: z.string().optional().transform(val => {
        if (!val) {
            return []
        }

        const parsed = ssp.array().decode(val)
        // TODO - handle wrong input
        return parsed
    }),
})
