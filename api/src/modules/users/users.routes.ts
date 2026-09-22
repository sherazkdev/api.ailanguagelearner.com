import fp from 'fastify-plugin';
import { z } from 'zod';
import { parseBody } from '../../shared/errors.js';
import { usersService } from './users.service.js';
import { ownerIdentityFieldsSchema } from '../../shared/owner-identity.js';

const ownerIdentityBodyProps = {
  deviceId: { type: 'string', description: 'Anonymous / device subscription identity' },
  userId: { type: 'string', description: 'Logged-in account identity' },
} as const;

export const usersRoutes = fp(async (app) => {
  app.post(
    '/v1/users/subscribe',
    {
      schema: {
        tags: ['Users'],
        summary: 'Upsert user after subscription (deviceId and/or userId)',
        body: {
          type: 'object',
          properties: {
            ...ownerIdentityBodyProps,
            subscriptionActive: { type: 'boolean' },
            subscriptionProvider: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const body = parseBody(
        ownerIdentityFieldsSchema
          .extend({
            subscriptionActive: z.boolean().default(true),
            subscriptionProvider: z.string().default('google'),
          })
          .refine((value) => Boolean(value.deviceId || value.userId), {
            message: 'deviceId or userId is required',
          }),
        request.body,
      );
      const user = await usersService.subscribe({
        deviceId: body.deviceId,
        userId: body.userId,
        subscriptionActive: body.subscriptionActive ?? true,
        subscriptionProvider: body.subscriptionProvider ?? 'google',
      });
      return reply.send({ user });
    },
  );

  app.get(
    '/v1/users/:deviceId',
    {
      schema: {
        tags: ['Users'],
        summary: 'Get user by deviceId',
        params: {
          type: 'object',
          required: ['deviceId'],
          properties: { deviceId: { type: 'string' } },
        },
      },
    },
    async (request) => {
      const { deviceId } = request.params as { deviceId: string };
      const user = await usersService.getByDeviceId(deviceId);
      return { user };
    },
  );

  app.get(
    '/v1/users/by-user-id/:userId',
    {
      schema: {
        tags: ['Users'],
        summary: 'Get user by userId (logged-in account)',
        params: {
          type: 'object',
          required: ['userId'],
          properties: { userId: { type: 'string' } },
        },
      },
    },
    async (request) => {
      const { userId } = request.params as { userId: string };
      const user = await usersService.getByUserId(userId);
      return { user };
    },
  );

  app.get(
    '/v1/users',
    {
      schema: {
        tags: ['Users'],
        summary: 'List recent users (admin)',
      },
    },
    async () => {
      const { UserModel } = await import('./user.model.js');
      const users = await UserModel.find().sort({ updatedAt: -1 }).limit(100).lean();
      return { users };
    },
  );
});
