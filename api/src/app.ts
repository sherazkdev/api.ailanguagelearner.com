import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swaggerUi from '@fastify/swagger-ui';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { authPlugin } from './plugins/auth.js';
import { swaggerPlugin } from './plugins/swagger.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { conversationTypesRoutes } from './modules/conversation-types/conversation-types.routes.js';
import { chatsRoutes } from './modules/chats/chats.routes.js';

export async function buildApp() {
  const app = Fastify({
    logger: true,
    requestTimeout: 35_000,
    connectionTimeout: 10_000,
    keepAliveTimeout: 72_000,
    bodyLimit: 1_048_576,
  });

  registerErrorHandler(app);

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
  });
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_TIME_WINDOW_MS,
  });

  // OpenAPI collector (must share root context with routes via fastify-plugin)
  await app.register(swaggerPlugin);

  await app.register(authPlugin);

  app.get(
    '/health',
    {
      schema: {
        tags: ['Health'],
        summary: 'Health check',
        security: [],
      },
    },
    async () => ({
      ok: true,
      service: 'lingua-ai-api',
      mongo: mongoose.connection.readyState === 1,
    }),
  );

  await app.register(conversationTypesRoutes);
  await app.register(usersRoutes);
  await app.register(chatsRoutes);

  // UI after all routes so /docs/json lists every operation
  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: true },
  });

  return app;
}
