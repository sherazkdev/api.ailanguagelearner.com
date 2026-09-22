import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';

/** OpenAPI generator only — UI registered after routes in app.ts */
export const swaggerPlugin = fp(async (app) => {
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Lingua AI API',
        description:
          'Language-learning chat backend. Prompt is stored on the chat at create time — clients send userMessage + deviceId and/or userId. LLM: Groq.',
        version: '1.0.0',
      },
      tags: [
        { name: 'Health' },
        { name: 'Users' },
        { name: 'ConversationTypes' },
        { name: 'Topics' },
        { name: 'Chats' },
      ],
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'x-api-key',
          },
        },
      },
      security: [{ ApiKeyAuth: [] }],
    },
  });
});
