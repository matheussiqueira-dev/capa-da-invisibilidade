import type { FastifyPluginAsync } from 'fastify';
import { config } from '../config.js';

const parseOrigins = (value: string) =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const isOriginAllowed = (origin: string | undefined, allowList: string[]) => {
  if (!origin) return false;
  if (allowList.includes('*')) return true;
  return allowList.includes(origin);
};

export const securityPlugin: FastifyPluginAsync = async (app) => {
  const allowList = parseOrigins(config.corsOrigin);

  app.addHook('onRequest', async (request, reply) => {
    const origin = request.headers.origin as string | undefined;
    if (isOriginAllowed(origin, allowList)) {
      reply.header('Access-Control-Allow-Origin', origin);
      reply.header('Vary', 'Origin');
    }

    reply.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
    reply.header('Access-Control-Max-Age', '600');

    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Referrer-Policy', 'no-referrer');
    reply.header('Permissions-Policy', 'camera=(), microphone=()');

    if (request.method === 'OPTIONS') {
      reply.status(204).send();
    }
  });
};
