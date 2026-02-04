import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { config } from '../config.js';
import { insertSnapshot, listSnapshots, getSnapshot, nowIso } from '../db/index.js';
import { parseWithSchema } from '../utils/validation.js';

const createSnapshotSchema = z.object({
  imageBase64: z.string().min(20),
  mimeType: z.string().optional().default('image/png'),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  config: z.record(z.any()).optional(),
  scene: z.record(z.any()).optional(),
  note: z.string().max(280).optional()
});

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

const normalizeBase64 = (value: string) =>
  value.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

const resolveExtension = (mimeType: string) => {
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  return 'png';
};

export const snapshotRoutes: FastifyPluginAsync = async (app) => {
  app.post('/snapshots', async (request, reply) => {
    const payload = parseWithSchema(createSnapshotSchema, request.body);
    const mimeType = payload.mimeType ?? 'image/png';
    const cleanBase64 = normalizeBase64(payload.imageBase64);
    const buffer = Buffer.from(cleanBase64, 'base64');

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
      config: payload.config ?? null,
      scene: payload.scene ?? null,
      note: payload.note ?? null
    });

    reply.status(201).send({
      id,
      createdAt,
      fileUrl: `/files/snapshots/${fileName}`
    });
  });

  app.get('/snapshots', async (request) => {
    const query = parseWithSchema(listQuerySchema, request.query);

    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const rows = await listSnapshots(limit, offset);

    return {
      items: rows.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        fileUrl: `/files/snapshots/${row.fileName}`,
        mimeType: row.mimeType,
        width: row.width,
        height: row.height,
        note: row.note
      })),
      limit,
      offset
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
      note: row.note,
      config: row.config,
      scene: row.scene
    };
  });
};
