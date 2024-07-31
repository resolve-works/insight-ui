
import {z} from 'zod';

export const schema = z.object({
    query: z.string().min(1),
    similarity_top_k: z.coerce.number().int().optional(),
})
