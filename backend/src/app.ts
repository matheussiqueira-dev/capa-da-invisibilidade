import fs from 'fs';
import path from 'path';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { config } from './config.js';
import { errorHandler } from './plugins/errorHandler.js';
import { securityPlugin } from './plugins/security.js';
import { rateLimitPlugin } from './plugins/rateLimit.js';
import { healthRoutes } from './routes/health.js';
import { snapshotRoutes } from './routes/snapshots.js';
import { metricsRoutes } from './routes/metrics.js';

export const buildApp = () => {
  const app = Fastify({
    logger: {
      level: config.env === 'production' ? 'info' : 'debug'
    },
    bodyLimit: config.bodyLimit
  });

  app.register(errorHandler);
  app.register(securityPlugin);

  const storageRoot = path.resolve(config.storageDir);
  fs.mkdirSync(storageRoot, { recursive: true });

  app.register(fastifyStatic, {
    root: storageRoot,
    prefix: '/files/'
  });

  app.register(healthRoutes);

  app.get('/', async () => ({
    name: 'Invisibility Cloak Backend',
    status: 'ok',
    docs: '/health',
    apiBase: '/api/v1'
  }));

  app.addHook('preHandler', async (request, reply) => {
    if (!request.url.startsWith('/api/v1')) return;
    if (request.method === 'OPTIONS') return;
    const apiKey = request.headers['x-api-key'];
    if (!apiKey || apiKey !== config.apiKey) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid API key'
      });
    }
  });

  app.register(
    async (api) => {
      await api.register(rateLimitPlugin);
      await api.register(snapshotRoutes);
      await api.register(metricsRoutes);
    },
    { prefix: '/api/v1' }
  );

  return app;
};
