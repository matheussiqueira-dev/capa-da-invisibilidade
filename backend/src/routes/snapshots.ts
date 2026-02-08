import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { config } from '../config.js';
import {
  deleteSnapshot,
  getSnapshot,
  insertSnapshot,
  listSnapshots,
  nowIso
} from '../db/index.js';
import { parseWithSchema } from '../utils/validation.js';

const createSnapshotSchema = z.object({
  imageBase64: z.string().min(20),
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/jpg']).optional().default('image/png'),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  sessionId: z.string().trim().min(3).max(120).optional(),
  qualityScore: z.number().min(0).max(100).optional(),
  config: z.record(z.any()).optional(),
  scene: z.record(z.any()).optional(),
  note: z.string().max(280).optional()
});

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sessionId: z.string().trim().min(3).max(120).optional()
});

const normalizeBase64 = (value: string) => value.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

const createRequestError = (message: string, statusCode = 400) => {
  const error = new Error(message);
  (error as { statusCode?: number }).statusCode = statusCode;
  return error;
};

const decodeBase64 = (value: string) => {
  const normalized = normalizeBase64(value).replace(/\s/g, '');
  if (!/^[A-Za-z0-9+/=]+$/.test(normalized)) {
    throw createRequestError('Invalid base64 payload');
  }

  const buffer = Buffer.from(normalized, 'base64');
  if (!buffer.length) {
    throw createRequestError('Empty image payload');
  }

  return buffer;
};

const resolveExtension = (mimeType: string) => (mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png');

export const snapshotRoutes: FastifyPluginAsync = async (app) => {
  app.post('/snapshots', async (request, reply) => {
    const payload = parseWithSchema(createSnapshotSchema, request.body);
    const mimeType = payload.mimeType ?? 'image/png';
    const buffer = decodeBase64(payload.imageBase64);

    const maxBytes = Math.min(config.bodyLimit, 6 * 1024 * 1024);
    if (buffer.length > maxBytes) {
      reply.status(413).send({
        error: 'PayloadTooLarge',
        message: 'Image exceeds allowed size'
      });
      return;
    }

    const id = randomUUID();
    const ext = resolveExtension(mimeType);
    const fileName = `${id}.${ext}`;
    const storageRoot = path.resolve(config.storageDir, 'snapshots');
    fs.mkdirSync(storageRoot, { recursive: true });

    const filePath = path.join(storageRoot, fileName);
    fs.writeFileSync(filePath, buffer);

    const createdAt = nowIso();
    await insertSnapshot({
      id,
      createdAt,
      fileName,
      mimeType,
      width: payload.width ?? null,
      height: payload.height ?? null,
      sessionId: payload.sessionId ?? null,
      qualityScore: payload.qualityScore ?? null,
      config: payload.config ?? null,
      scene: payload.scene ?? null,
      note: payload.note?.trim() || null
    });

    reply.status(201).send({
      id,
      createdAt,
      fileUrl: `/files/snapshots/${fileName}`
    });
  });

  app.get('/snapshots', async (request) => {
    const query = parseWithSchema(listQuerySchema, request.query);
    const result = await listSnapshots({
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
      sessionId: query.sessionId
    });

    return {
      items: result.items.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        fileUrl: `/files/snapshots/${row.fileName}`,
        mimeType: row.mimeType,
        width: row.width,
        height: row.height,
        sessionId: row.sessionId,
        qualityScore: row.qualityScore,
        note: row.note
      })),
      meta: {
        limit: result.limit,
        offset: result.offset,
        total: result.total,
        sessionId: query.sessionId ?? null
      }
    };
  });

  app.get('/snapshots/:id', async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const row = await getSnapshot(id);

    if (!row) {
      reply.status(404).send({ error: 'NotFound', message: 'Snapshot not found' });
      return;
    }

    return {
      id: row.id,
      createdAt: row.createdAt,
      fileUrl: `/files/snapshots/${row.fileName}`,
      mimeType: row.mimeType,
      width: row.width,
      height: row.height,
      sessionId: row.sessionId,
      qualityScore: row.qualityScore,
      note: row.note,
      config: row.config,
      scene: row.scene
    };
  });

  app.delete('/snapshots/:id', async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const removed = await deleteSnapshot(id);
    if (!removed) {
      reply.status(404).send({ error: 'NotFound', message: 'Snapshot not found' });
      return;
    }

    const filePath = path.resolve(config.storageDir, 'snapshots', removed.fileName);
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { force: true });
    }

    reply.status(204).send();
  });
};
