import type { FastifyInstance } from 'fastify';
import { AppError } from '../shared/errors.js';
import { ZodError } from 'zod';

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: unknown, _request, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        error: error.message,
        details: error.details ?? undefined,
      });
    }
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: 'Validation failed',
        details: error.flatten(),
      });
    }
    if (
      typeof error === 'object' &&
      error !== null &&
      'validation' in error &&
      (error as { validation?: unknown }).validation
    ) {
      return reply.code(400).send({
        error: 'Validation failed',
        details: (error as { validation: unknown }).validation,
      });
    }
    app.log.error(error);
    return reply.code(500).send({ error: 'Internal server error' });
  });
}
