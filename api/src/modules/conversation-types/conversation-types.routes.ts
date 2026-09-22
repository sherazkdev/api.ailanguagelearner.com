import fp from 'fastify-plugin';
import { z } from 'zod';
import { parseBody, parseQuery } from '../../shared/errors.js';
import { conversationTypesService } from './conversation-types.service.js';

export const conversationTypesRoutes = fp(async (app) => {
  app.get(
    '/v1/conversation-types',
    {
      schema: {
        tags: ['ConversationTypes'],
        summary: 'List conversation types (app Choose Conversation Type screen)',
        querystring: {
          type: 'object',
          properties: {
            filter: {
              type: 'string',
              enum: ['all', 'daily_life', 'work', 'travel'],
            },
          },
        },
      },
    },
    async (request) => {
      const q = parseQuery(
        z.object({
          filter: z.enum(['all', 'daily_life', 'work', 'travel']).optional(),
        }),
        request.query,
      );
      const types = await conversationTypesService.list(q.filter);
      return { types };
    },
  );

  app.get(
    '/v1/conversation-types/:slugOrId',
    {
      schema: {
        tags: ['ConversationTypes'],
        summary: 'Get one conversation type',
        params: {
          type: 'object',
          required: ['slugOrId'],
          properties: { slugOrId: { type: 'string' } },
        },
      },
    },
    async (request) => {
      const { slugOrId } = request.params as { slugOrId: string };
      const type = await conversationTypesService.getBySlugOrId(slugOrId);
      return { type };
    },
  );

  app.post(
    '/v1/conversation-types',
    {
      schema: {
        tags: ['ConversationTypes'],
        summary: 'Create conversation type (admin)',
        body: {
          type: 'object',
          required: ['slug', 'title', 'description', 'iconKey', 'filterGroup'],
          properties: {
            slug: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            iconKey: { type: 'string' },
            filterGroup: {
              type: 'string',
              enum: ['all', 'daily_life', 'work', 'travel', 'other'],
            },
            sortOrder: { type: 'number' },
          },
        },
      },
    },
    async (request, reply) => {
      const body = parseBody(
        z.object({
          slug: z.string().min(2),
          title: z.string().min(1),
          description: z.string().min(1),
          iconKey: z.string().min(1),
          filterGroup: z.enum(['all', 'daily_life', 'work', 'travel', 'other']),
          sortOrder: z.number().optional(),
        }),
        request.body,
      );
      const type = await conversationTypesService.create(body);
      return reply.code(201).send({ type });
    },
  );
});
