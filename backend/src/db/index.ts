import fs from 'fs';
import path from 'path';
import { config } from '../config';

export type SnapshotRecord = {
  id: string;
  createdAt: string;
  fileName: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  config: Record<string, unknown> | null;
  scene: Record<string, unknown> | null;
  note: string | null;
};

export type MetricsRecord = {
  id: string;
  createdAt: string;
  sessionId: string | null;
  fps: number;
  config: Record<string, unknown> | null;
  scene: Record<string, unknown> | null;
  client: Record<string, unknown> | null;
};

type StoreShape = {
  snapshots: SnapshotRecord[];
  metrics: MetricsRecord[];
};

const dbPath = path.resolve(config.databasePath);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const defaultStore: StoreShape = {
  snapshots: [],
  metrics: []
};

const readStore = async (): Promise<StoreShape> => {
  if (!fs.existsSync(dbPath)) {
    await fs.promises.writeFile(dbPath, JSON.stringify(defaultStore, null, 2));
    return { ...defaultStore };
  }

  const raw = await fs.promises.readFile(dbPath, 'utf-8');
  try {
    const parsed = JSON.parse(raw) as StoreShape;
    return {
      snapshots: Array.isArray(parsed.snapshots) ? parsed.snapshots : [],
      metrics: Array.isArray(parsed.metrics) ? parsed.metrics : []
    };
  } catch {
    await fs.promises.writeFile(dbPath, JSON.stringify(defaultStore, null, 2));
    return { ...defaultStore };
  }
};

const writeStore = async (store: StoreShape) => {
  await fs.promises.writeFile(dbPath, JSON.stringify(store, null, 2));
};

let queue: Promise<unknown> = Promise.resolve();

const withStore = async <T>(handler: (store: StoreShape) => T | Promise<T>): Promise<T> => {
  const task = async () => {
    const store = await readStore();
    const result = await handler(store);
    await writeStore(store);
    return result;
  };

  queue = queue.then(task, task);
  return queue as Promise<T>;
};

const sortByDateDesc = <T extends { createdAt: string }>(a: T, b: T) =>
  b.createdAt.localeCompare(a.createdAt);

export const nowIso = () => new Date().toISOString();

export const insertSnapshot = async (record: SnapshotRecord) =>
  withStore((store) => {
    store.snapshots.push(record);
    return record;
  });

export const listSnapshots = async (limit: number, offset: number) => {
  const store = await readStore();
  return [...store.snapshots].sort(sortByDateDesc).slice(offset, offset + limit);
};

export const getSnapshot = async (id: string) => {
  const store = await readStore();
  return store.snapshots.find((item) => item.id === id) ?? null;
};

export const insertMetric = async (record: MetricsRecord) =>
  withStore((store) => {
    store.metrics.push(record);
    return record;
  });

export const listRecentMetrics = async () => {
  const store = await readStore();
  return [...store.metrics].sort(sortByDateDesc).slice(0, 20);
};

export const getMetricsSummary = async () => {
  const store = await readStore();
  const total = store.metrics.length;
  const avgFps = total
    ? store.metrics.reduce((sum, item) => sum + item.fps, 0) / total
    : 0;
  const lastEventAt = store.metrics
    .map((item) => item.createdAt)
    .sort()
    .at(-1) ?? null;

  return {
    total,
    avgFps,
    lastEventAt
  };
};
