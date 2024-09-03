
import {z} from 'zod';

export const schema = z.object({
    "folders[]": z.string().array().optional().default([])
})
