
import { z } from 'zod';

export const pagerange_schema = (number_of_pages: number) => {
    return z.object({
        from_page: z.coerce.number().int().gte(1).lte(number_of_pages),
        to_page: z.coerce.number().int().gte(1).lte(number_of_pages),
    })
}

export const name_schema = z.object({
    name: z.string(),
})

export const pagerange_refinement = (data: Record<string, any>, context: z.RefinementCtx) => {
    if(data.from_page > data.to_page) {
        context.addIssue({
            message: "Number must be smaller or equal to last page",
            path: ["from_page"],
            code: z.ZodIssueCode.too_big,
            type: "number",
            maximum: data.to_page,
            inclusive: true,
        })
        context.addIssue({
            message: "Number must be greater or equal to first page",
            path: ["to_page"],
            code: z.ZodIssueCode.too_small,
            type: "number",
            minimum: data.from_page,
            inclusive: true,
        })
    }
}

