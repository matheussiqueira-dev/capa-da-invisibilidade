import type { FastifyPluginAsync } from 'fastify';
import { config } from '../config.js';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweepAt = 0;

const sweepBuckets = (now: number) => {
  if (now - lastSweepAt < config.rateLimitWindowMs) return;
  lastSweepAt = now;

  for (const [key, bucket] of buckets.entries()) {
    if (now >= bucket.resetAt) {
      buckets.delete(key);
    }
  }
};

export const rateLimitPlugin: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', async (request, reply) => {
    const pathname = request.url.split('?')[0];
    const key = `${request.ip}:${request.method}:${pathname}`;
    const now = Date.now();
    const windowMs = config.rateLimitWindowMs;
    const limit = config.rateLimitMax;

    sweepBuckets(now);

    const bucket = buckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      const resetAt = now + windowMs;
      buckets.set(key, { count: 1, resetAt });
      reply.header('X-RateLimit-Limit', String(limit));
      reply.header('X-RateLimit-Remaining', String(limit - 1));
      reply.header('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
      return;
    }

    bucket.count += 1;
    const remaining = Math.max(limit - bucket.count, 0);
    reply.header('X-RateLimit-Limit', String(limit));
    reply.header('X-RateLimit-Remaining', String(remaining));
    reply.header('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > limit) {
      reply.header('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
      return reply.status(429).send({
        error: 'TooManyRequests',
        message: 'Rate limit exceeded'
      });
    }
  });
};
