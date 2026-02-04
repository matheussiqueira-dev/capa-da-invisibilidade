import fs from 'fs';
import path from 'path';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { config } from './config';
import { errorHandler } from './plugins/errorHandler';
import { securityPlugin } from './plugins/security';
import { rateLimitPlugin } from './plugins/rateLimit';
import { authPlugin } from './plugins/auth';
import { healthRoutes } from './routes/health';
import { snapshotRoutes } from './routes/snapshots';
import { metricsRoutes } from './routes/metrics';

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

  app.register(
    async (api) => {
      await api.register(rateLimitPlugin);
      await api.register(authPlugin);
      await api.register(snapshotRoutes);
      await api.register(metricsRoutes);
    },
    { prefix: '/api/v1' }
  );

  return app;
};
