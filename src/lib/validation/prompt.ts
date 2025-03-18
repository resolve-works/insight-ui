import { z } from 'zod';
import { string_to_json_schema } from '.';

export const schema = z.object({
	folders: string_to_json_schema.pipe(z.string().array()),
	query: z.string().min(1),
	// Parsing optional number with 'coerce.number' will parse to 0 irregardless of .default(3)
	// https://github.com/colinhacks/zod/issues/2461
	amount: z
		.literal('')
		.transform(() => undefined)
		.or(z.coerce.number().int().min(1).max(30))
		.optional()
});
