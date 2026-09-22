import fp from 'fastify-plugin';
import { z } from 'zod';
import { parseBody, parseQuery } from '../../shared/errors.js';
import { chatsService } from './chats.service.js';
import {
  ownerIdentityFieldsSchema,
  ownerIdentityQuerySchema,
} from '../../shared/owner-identity.js';

const ownerIdentityQueryProps = {
  deviceId: { type: 'string', description: 'Anonymous / device identity' },
  userId: { type: 'string', description: 'Logged-in account identity' },
} as const;

const ownerIdentityBodyProps = {
  deviceId: { type: 'string', description: 'Anonymous / device identity' },
  userId: { type: 'string', description: 'Logged-in account identity' },
} as const;

export const chatsRoutes = fp(async (app) => {
  app.get(
    '/v1/chats',
    {
      schema: {
        tags: ['Chats'],
        summary: 'List chats for deviceId and/or userId',
        querystring: {
          type: 'object',
          properties: ownerIdentityQueryProps,
        },
      },
    },
    async (request) => {
      const q = parseQuery(ownerIdentityQuerySchema, request.query);
      const chats = await chatsService.listByOwner(q);
      return { chats };
    },
  );

  app.post(
    '/v1/chats',
    {
      schema: {
        tags: ['Chats'],
        summary: 'Create chat — systemInstruction stored once on server (not resent each message)',
        body: {
          type: 'object',
          required: ['mode', 'learningLanguageName'],
          properties: {
            ...ownerIdentityBodyProps,
            mode: { type: 'string', enum: ['role_play', 'free_chat'] },
            learningLanguageName: { type: 'string' },
            typeId: { type: 'string' },
            difficultyKey: {
              type: 'string',
              enum: ['dl_beginner', 'dl_intermediate', 'dl_advanced'],
            },
          },
        },
      },
    },
    async (request, reply) => {
      const body = parseBody(
        ownerIdentityFieldsSchema
          .extend({
            mode: z.enum(['role_play', 'free_chat']),
            learningLanguageName: z.string().min(1),
            typeId: z.string().optional(),
            difficultyKey: z.enum(['dl_beginner', 'dl_intermediate', 'dl_advanced']).optional(),
          })
          .refine((value) => Boolean(value.deviceId || value.userId), {
            message: 'deviceId or userId is required',
          }),
        request.body,
      );
      const chat = await chatsService.create(body);
      return reply.code(201).send({ chat });
    },
  );

  app.get(
    '/v1/chats/:chatId',
    {
      schema: {
        tags: ['Chats'],
        summary: 'Get one chat (no systemInstruction in response)',
        params: {
          type: 'object',
          required: ['chatId'],
          properties: { chatId: { type: 'string' } },
        },
        querystring: {
          type: 'object',
          properties: ownerIdentityQueryProps,
        },
      },
    },
    async (request) => {
      const { chatId } = request.params as { chatId: string };
      const q = parseQuery(ownerIdentityQuerySchema, request.query);
      const chat = await chatsService.getOne(chatId, q);
      return { chat };
    },
  );

  app.get(
    '/v1/chats/:chatId/messages',
    {
      schema: {
        tags: ['Chats'],
        summary: 'Fetch chat message history',
        params: {
          type: 'object',
          required: ['chatId'],
          properties: { chatId: { type: 'string' } },
        },
        querystring: {
          type: 'object',
          properties: ownerIdentityQueryProps,
        },
      },
    },
    async (request) => {
      const { chatId } = request.params as { chatId: string };
      const q = parseQuery(ownerIdentityQuerySchema, request.query);
      return chatsService.listMessages(chatId, q);
    },
  );

  app.post(
    '/v1/chats/:chatId/messages',
    {
      schema: {
        tags: ['Chats'],
        summary: 'Send userMessage — server loads prompt + history from Mongo, calls Groq',
        params: {
          type: 'object',
          required: ['chatId'],
          properties: { chatId: { type: 'string' } },
        },
        body: {
          type: 'object',
          required: ['userMessage'],
          properties: {
            ...ownerIdentityBodyProps,
            userMessage: { type: 'string' },
          },
        },
      },
    },
    async (request) => {
      const { chatId } = request.params as { chatId: string };
      const body = parseBody(
        ownerIdentityFieldsSchema
          .extend({
            userMessage: z.string().min(1).max(4000),
          })
          .refine((value) => Boolean(value.deviceId || value.userId), {
            message: 'deviceId or userId is required',
          }),
        request.body,
      );
      return chatsService.sendMessage(
        chatId,
        { deviceId: body.deviceId, userId: body.userId },
        body.userMessage,
      );
    },
  );

  app.delete(
    '/v1/chats/:chatId',
    {
      schema: {
        tags: ['Chats'],
        summary: 'Delete chat and its messages',
        params: {
          type: 'object',
          required: ['chatId'],
          properties: { chatId: { type: 'string' } },
        },
        querystring: {
          type: 'object',
          properties: ownerIdentityQueryProps,
        },
      },
    },
    async (request) => {
      const { chatId } = request.params as { chatId: string };
      const q = parseQuery(ownerIdentityQuerySchema, request.query);
      return chatsService.remove(chatId, q);
    },
  );
});
