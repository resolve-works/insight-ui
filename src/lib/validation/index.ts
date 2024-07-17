
import { z } from "zod"
import type { Schema } from "zod"

export class ValidationError extends Error {
    data: Record<string, any>
    errors: Record<string, any>

    constructor(errors: Record<string, any>, data: Record<string, any>) {
        super('Form validation failed')
        this.data = data;
        this.errors = errors;
    }

    format() {
        const { data, errors } = this;
        return { data, errors }
    }
}

export async function validate(request: Request, schema: Schema) {
    const form_data = Object.fromEntries((await request.formData()).entries())

    try {
        return schema.parse(form_data)
    } catch(err) {
        if(err instanceof z.ZodError) {
            throw new ValidationError(err.format(), form_data)
        }

        throw err
    }
}
