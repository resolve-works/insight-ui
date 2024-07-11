
import { z } from 'zod';

export const schema = z.object({
    name: z.string(),
    parent_id: z.string().uuid(),
})
