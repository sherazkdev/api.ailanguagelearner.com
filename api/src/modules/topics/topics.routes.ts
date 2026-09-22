import fp from 'fastify-plugin';
import { topicsService } from './topics.service.js';

export const topicsRoutes = fp(async (app) => {
  app.get(
    '/v1/conversation-types/:slugOrId/topics',
    {
      schema: {
        tags: ['Topics'],
        summary: 'List topics for a conversation type (role-play flow step 2)',
        params: {
          type: 'object',
          required: ['slugOrId'],
          properties: { slugOrId: { type: 'string' } },
        },
      },
    },
    async (request) => {
      const { slugOrId } = request.params as { slugOrId: string };
      return topicsService.listByTypeSlugOrId(slugOrId);
    },
  );
});
