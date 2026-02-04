import type { FastifyPluginAsync } from 'fastify';
import { config } from '../config';

export const authPlugin: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', async (request, reply) => {
    if (request.method === 'OPTIONS') return;

    const apiKey = request.headers['x-api-key'];
    if (!apiKey || apiKey !== config.apiKey) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid API key'
      });
    }
  });
};
