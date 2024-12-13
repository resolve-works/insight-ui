import { z } from 'zod';
import { string_to_json_schema } from '.';

export const schema = z.object({
	folders: string_to_json_schema.pipe(z.string().array())
});
