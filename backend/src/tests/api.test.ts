import assert from 'node:assert/strict';
import { test, before, after } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

process.env.NODE_ENV = 'test';
process.env.API_KEY = 'test-key';
process.env.DATABASE_PATH = './data/test-app.json';
process.env.STORAGE_DIR = './storage-test';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.RATE_LIMIT_MAX = '200';
process.env.RATE_LIMIT_WINDOW_MS = '60000';

let app: { inject: Function; close: Function };

const cleanup = () => {
  const dbPath = path.resolve('./data/test-app.json');
  const storagePath = path.resolve('./storage-test');
  if (fs.existsSync(dbPath)) {
    fs.rmSync(dbPath, { force: true });
  }
  if (fs.existsSync(storagePath)) {
    fs.rmSync(storagePath, { recursive: true, force: true });
  }
};

const authHeaders = {
  'x-api-key': 'test-key',
  'content-type': 'application/json'
};

before(async () => {
  cleanup();
  const module = await import('../app.js');
  app = module.buildApp();
});

after(async () => {
  await app.close();
  cleanup();
});

test('health endpoint responds with environment and timestamp', async () => {
  const response = await app.inject({ method: 'GET', url: '/health' });
  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.environment, 'test');
  assert.ok(body.timestamp);
});

test('api root returns resource map', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/api/v1',
    headers: { 'x-api-key': 'test-key' }
  });
  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.equal(body.version, 'v1');
  assert.ok(body.resources.snapshots);
});

test('api requires key', async () => {
  const response = await app.inject({ method: 'GET', url: '/api/v1/snapshots' });
  assert.equal(response.statusCode, 401);
});

test('snapshot lifecycle includes get/list/delete', async () => {
  const payload = {
    imageBase64: `data:image/png;base64,${Buffer.from('test-image-content').toString('base64')}`,
    mimeType: 'image/png',
    width: 640,
    height: 480,
    sessionId: 'session-1',
    qualityScore: 82,
    note: 'Teste'
  };

  const create = await app.inject({
    method: 'POST',
    url: '/api/v1/snapshots',
    headers: authHeaders,
    payload
  });
  assert.equal(create.statusCode, 201);
  const created = create.json();
  assert.ok(created.id);

  const list = await app.inject({
    method: 'GET',
    url: '/api/v1/snapshots?limit=5&sessionId=session-1',
    headers: { 'x-api-key': 'test-key' }
  });
  assert.equal(list.statusCode, 200);
  const listBody = list.json();
  assert.ok(Array.isArray(listBody.items));
  assert.ok(listBody.items.length >= 1);
  assert.ok(listBody.meta.total >= 1);

  const detail = await app.inject({
    method: 'GET',
    url: `/api/v1/snapshots/${created.id}`,
    headers: { 'x-api-key': 'test-key' }
  });
  assert.equal(detail.statusCode, 200);
  const detailBody = detail.json();
  assert.equal(detailBody.sessionId, 'session-1');
  assert.equal(detailBody.qualityScore, 82);

  const remove = await app.inject({
    method: 'DELETE',
    url: `/api/v1/snapshots/${created.id}`,
    headers: { 'x-api-key': 'test-key' }
  });
  assert.equal(remove.statusCode, 204);

  const deletedDetail = await app.inject({
    method: 'GET',
    url: `/api/v1/snapshots/${created.id}`,
    headers: { 'x-api-key': 'test-key' }
  });
  assert.equal(deletedDetail.statusCode, 404);
});

test('snapshot rejects invalid base64', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/snapshots',
    headers: authHeaders,
    payload: {
      imageBase64: 'not-base64!',
      mimeType: 'image/png'
    }
  });
  assert.equal(response.statusCode, 400);
});

test('metrics ingestion supports summary, recent and timeline', async () => {
  const first = await app.inject({
    method: 'POST',
    url: '/api/v1/metrics',
    headers: authHeaders,
    payload: {
      sessionId: 'session-a',
      fps: 30,
      qualityScore: 65
    }
  });
  assert.equal(first.statusCode, 201);

  const second = await app.inject({
    method: 'POST',
    url: '/api/v1/metrics',
    headers: authHeaders,
    payload: {
      sessionId: 'session-a',
      fps: 45,
      qualityScore: 90
    }
  });
  assert.equal(second.statusCode, 201);

  const summary = await app.inject({
    method: 'GET',
    url: '/api/v1/metrics/summary?sessionId=session-a',
    headers: { 'x-api-key': 'test-key' }
  });
  assert.equal(summary.statusCode, 200);
  const summaryBody = summary.json();
  assert.equal(summaryBody.total, 2);
  assert.equal(summaryBody.avgFps, 37.5);
  assert.equal(summaryBody.avgQualityScore, 77.5);

  const recent = await app.inject({
    method: 'GET',
    url: '/api/v1/metrics/recent?limit=10&sessionId=session-a',
    headers: { 'x-api-key': 'test-key' }
  });
  assert.equal(recent.statusCode, 200);
  const recentBody = recent.json();
  assert.equal(recentBody.meta.total, 2);
  assert.equal(recentBody.items.length, 2);

  const timeline = await app.inject({
    method: 'GET',
    url: '/api/v1/metrics/timeline?limit=5&sessionId=session-a',
    headers: { 'x-api-key': 'test-key' }
  });
  assert.equal(timeline.statusCode, 200);
  const timelineBody = timeline.json();
  assert.equal(timelineBody.items.length, 2);
});
