import type { FastifyPluginAsync } from 'fastify';
import { config } from '../config.js';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async () => ({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    environment: config.env,
    timestamp: new Date().toISOString()
  }));
};
