import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import {
  getMetricsSummary,
  insertMetric,
  listMetrics,
  listMetricsTimeline,
  nowIso
} from '../db/index.js';
import { parseWithSchema } from '../utils/validation.js';

const metricsSchema = z.object({
  sessionId: z.string().trim().min(3).max(120).optional(),
  fps: z.number().min(1).max(120),
  qualityScore: z.number().min(0).max(100).optional(),
  config: z.record(z.any()).optional(),
  scene: z.record(z.any()).optional(),
  client: z.record(z.any()).optional()
});

const listMetricsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sessionId: z.string().trim().min(3).max(120).optional()
});

const summaryQuerySchema = z.object({
  sessionId: z.string().trim().min(3).max(120).optional()
});

const timelineQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(120).default(30),
  sessionId: z.string().trim().min(3).max(120).optional()
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
      qualityScore: payload.qualityScore ?? null,
      config: payload.config ?? null,
      scene: payload.scene ?? null,
      client: payload.client ?? null
    });

    reply.status(201).send({ id, createdAt });
  });

  app.get('/metrics/summary', async (request) => {
    const query = parseWithSchema(summaryQuerySchema, request.query);
    const row = await getMetricsSummary(query.sessionId);

    return {
      total: row.total,
      avgFps: row.avgFps ? Math.round(row.avgFps * 10) / 10 : 0,
      avgQualityScore: row.avgQualityScore ? Math.round(row.avgQualityScore * 10) / 10 : 0,
      lastEventAt: row.lastEventAt,
      sessionId: query.sessionId ?? null
    };
  });

  app.get('/metrics/recent', async (request) => {
    const query = parseWithSchema(listMetricsQuerySchema, request.query);
    const rows = await listMetrics({
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
      sessionId: query.sessionId
    });

    return {
      items: rows.items.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        sessionId: row.sessionId,
        fps: row.fps,
        qualityScore: row.qualityScore,
        config: row.config,
        scene: row.scene
      })),
      meta: {
        limit: rows.limit,
        offset: rows.offset,
        total: rows.total,
        sessionId: query.sessionId ?? null
      }
    };
  });

  app.get('/metrics/timeline', async (request) => {
    const query = parseWithSchema(timelineQuerySchema, request.query);
    const items = await listMetricsTimeline(query.limit ?? 30, query.sessionId);
    return {
      items,
      meta: {
        limit: query.limit ?? 30,
        sessionId: query.sessionId ?? null
      }
    };
  });
};
