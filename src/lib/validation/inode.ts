
import {z} from 'zod';

export const schema = z.object({
    name: z.string().min(1),
    parent_id: z.number().int().optional(),
})
