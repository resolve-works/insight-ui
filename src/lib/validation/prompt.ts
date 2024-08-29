
import {z} from 'zod';

export const schema = z.object({
    query: z.string().min(1),
    // Parsing optional number with 'coerce.number' will parse to 0 irregardless of .default(3)
    // https://github.com/colinhacks/zod/issues/2461
    similarity_top_k: z
        .literal("").transform(() => 3)
        .or(z.coerce.number().int())
        .optional()
})
