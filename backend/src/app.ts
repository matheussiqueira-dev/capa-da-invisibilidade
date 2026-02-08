import fs from 'fs';
import path from 'path';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { config } from './config.js';
import { errorHandler } from './plugins/errorHandler.js';
import { securityPlugin } from './plugins/security.js';
import { rateLimitPlugin } from './plugins/rateLimit.js';
import { enforceApiKey } from './plugins/apiKeyAuth.js';
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

  app.register(
    async (api) => {
      await api.register(rateLimitPlugin);
      api.addHook('preHandler', enforceApiKey);

      api.get('/', async () => ({
        version: 'v1',
        resources: {
          snapshots: '/api/v1/snapshots',
          metrics: '/api/v1/metrics'
        }
      }));

      await api.register(snapshotRoutes);
      await api.register(metricsRoutes);
    },
    { prefix: '/api/v1' }
  );

  return app;
};
