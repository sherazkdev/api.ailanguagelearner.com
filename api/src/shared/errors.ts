import { ZodError, type ZodSchema } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function parseBody<T>(schema: ZodSchema<T>, body: unknown): T {
  try {
    return schema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new AppError(400, 'Validation failed', err.flatten());
    }
    throw err;
  }
}

export function parseQuery<T>(schema: ZodSchema<T>, query: unknown): T {
  return parseBody(schema, query);
}
