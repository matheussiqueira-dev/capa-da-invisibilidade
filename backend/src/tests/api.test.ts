import assert from 'node:assert/strict';
import { test, before, after } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

process.env.API_KEY = 'test-key';
process.env.DATABASE_PATH = './data/test-app.json';
process.env.STORAGE_DIR = './storage-test';
process.env.CORS_ORIGIN = 'http://localhost:3000';

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

before(async () => {
  cleanup();
  const module = await import('../app.js');
  app = module.buildApp();
});

after(async () => {
  await app.close();
  cleanup();
});

test('health endpoint responds', async () => {
  const response = await app.inject({ method: 'GET', url: '/health' });
  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.equal(body.status, 'ok');
});

test('api requires key', async () => {
  const response = await app.inject({ method: 'GET', url: '/api/v1/snapshots' });
  assert.equal(response.statusCode, 401);
});

test('snapshot lifecycle', async () => {
  const payload = {
    imageBase64: `data:image/png;base64,${Buffer.from('test-image-content').toString('base64')}`,
    mimeType: 'image/png',
    width: 640,
    height: 480,
    note: 'Teste'
  };
  const create = await app.inject({
    method: 'POST',
    url: '/api/v1/snapshots',
    headers: { 'x-api-key': 'test-key', 'content-type': 'application/json' },
    payload
  });
  assert.equal(create.statusCode, 201);
  const created = create.json();
  assert.ok(created.id);

  const list = await app.inject({
    method: 'GET',
    url: '/api/v1/snapshots?limit=5',
    headers: { 'x-api-key': 'test-key' }
  });
  assert.equal(list.statusCode, 200);
  const listBody = list.json();
  assert.ok(Array.isArray(listBody.items));
  assert.ok(listBody.items.length >= 1);
});

test('metrics ingestion', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/metrics',
    headers: { 'x-api-key': 'test-key', 'content-type': 'application/json' },
    payload: { fps: 30 }
  });
  assert.equal(response.statusCode, 201);

  const summary = await app.inject({
    method: 'GET',
    url: '/api/v1/metrics/summary',
    headers: { 'x-api-key': 'test-key' }
  });
  assert.equal(summary.statusCode, 200);
  const summaryBody = summary.json();
  assert.ok(summaryBody.total >= 1);
});
