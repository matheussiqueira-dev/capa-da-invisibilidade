import type { ZodSchema } from 'zod';

export const parseWithSchema = <T>(schema: ZodSchema<T>, payload: unknown): T => {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const error = new Error('Validation error');
    (error as { statusCode?: number }).statusCode = 400;
    (error as { details?: unknown }).details = result.error.flatten();
    throw error;
  }
  return result.data;
};
