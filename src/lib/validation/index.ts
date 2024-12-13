import { z } from 'zod';
import type { Schema } from 'zod';

export class ValidationError extends Error {
	data: Record<string, any>;
	errors: Record<string, any>;

	constructor(errors: Record<string, any>, data: Record<string, any>) {
		super('Form validation failed');
		this.data = data;
		this.errors = errors;
	}

	format() {
		const { data, errors } = this;
		return { data, errors };
	}
}

export async function validate(request: Request, schema: Schema) {
	const form_data = await request.formData();

	// Convert form_data to object that zod can handle
	const data = Array.from(form_data.entries()).reduce(
		(agg: Record<string, any>, [key, value]: [string, any]) => {
			// Support array inputs with `[]` appended to their name
			const is_array = key.slice(-2) == '[]';
			if (is_array && !Array.isArray(agg[key])) {
				agg[key] = [];
			}

			if (is_array) {
				agg[key] = [...agg[key], value];
			} else {
				agg[key] = value;
			}

			return agg;
		},
		{}
	);

	try {
		return schema.parse(data);
	} catch (err) {
		if (err instanceof z.ZodError) {
			throw new ValidationError(err.format(), data);
		}

		throw err;
	}
}

export const string_to_json_schema = z.string().transform((str, ctx) => {
	try {
		return JSON.parse(str);
	} catch (e) {
		ctx.addIssue({ code: 'custom', message: 'Invalid JSON' });
		return z.NEVER;
	}
});
