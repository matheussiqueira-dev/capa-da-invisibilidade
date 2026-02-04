import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { insertMetric, listRecentMetrics, getMetricsSummary, nowIso } from '../db';
import { parseWithSchema } from '../utils/validation';

const metricsSchema = z.object({
  sessionId: z.string().optional(),
  fps: z.number().min(1).max(120),
  config: z.record(z.any()).optional(),
  scene: z.record(z.any()).optional(),
  client: z.record(z.any()).optional()
});

export const metricsRoutes: FastifyPluginAsync = async (app) => {
  app.post('/metrics', async (request, reply) => {
    const payload = parseWithSchema(metricsSchema, request.body);
    const id = randomUUID();
    const createdAt = nowIso();

    await insertMetric({
      id,
      createdAt,
      sessionId: payload.sessionId ?? null,
      fps: payload.fps,
      config: payload.config ?? null,
      scene: payload.scene ?? null,
      client: payload.client ?? null
    });

    reply.status(201).send({ id, createdAt });
  });

  app.get('/metrics/summary', async () => {
    const row = await getMetricsSummary();

    return {
      total: row.total,
      avgFps: row.avgFps ? Math.round(row.avgFps * 10) / 10 : 0,
      lastEventAt: row.lastEventAt
    };
  });

  app.get('/metrics/recent', async () => {
    const rows = await listRecentMetrics();

    return {
      items: rows.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        sessionId: row.sessionId,
        fps: row.fps,
        config: row.config,
        scene: row.scene
      }))
    };
  });
};
