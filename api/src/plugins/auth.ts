import fp from 'fastify-plugin';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../config/env.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export const authPlugin = fp(async (app) => {
  app.decorate('authenticate', async (request, reply) => {
    const key = request.headers['x-api-key'];
    if (typeof key !== 'string' || key !== env.X_API_KEY) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Valid x-api-key header is required',
      });
    }
  });

  app.addHook('onRequest', async (request, reply) => {
    const path = request.url.split('?')[0] ?? '';
    if (path === '/health' || path.startsWith('/docs')) return;
    await app.authenticate(request, reply);
    if (reply.sent) return;
  });
});
