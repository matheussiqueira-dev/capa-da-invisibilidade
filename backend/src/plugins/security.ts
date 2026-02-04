import type { FastifyPluginAsync } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { config } from '../config';

export const securityPlugin: FastifyPluginAsync = async (app) => {
  await app.register(helmet, {
    global: true,
    contentSecurityPolicy: false
  });

  await app.register(cors, {
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-API-Key']
  });
};
