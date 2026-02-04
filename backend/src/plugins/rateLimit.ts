import type { FastifyPluginAsync } from 'fastify';
import { config } from '../config.js';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export const rateLimitPlugin: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', async (request, reply) => {
    const key = request.ip;
    const now = Date.now();
    const windowMs = config.rateLimitWindowMs;
    const limit = config.rateLimitMax;

    const bucket = buckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }

    bucket.count += 1;
    if (bucket.count > limit) {
      return reply.status(429).send({
        error: 'TooManyRequests',
        message: 'Rate limit exceeded'
      });
    }
  });
};
