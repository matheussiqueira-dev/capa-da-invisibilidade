import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

export type SnapshotRecord = {
  id: string;
  createdAt: string;
  fileName: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  sessionId: string | null;
  qualityScore: number | null;
  config: Record<string, unknown> | null;
  scene: Record<string, unknown> | null;
  note: string | null;
};

export type MetricsRecord = {
  id: string;
  createdAt: string;
  sessionId: string | null;
  fps: number;
  qualityScore: number | null;
  config: Record<string, unknown> | null;
  scene: Record<string, unknown> | null;
  client: Record<string, unknown> | null;
};

type StoreShape = {
  snapshots: SnapshotRecord[];
  metrics: MetricsRecord[];
};

type PaginationOptions = {
  limit: number;
  offset: number;
  sessionId?: string;
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

let queue: Promise<void> = Promise.resolve();

const runExclusive = <T>(task: () => Promise<T>): Promise<T> => {
  const run = queue.then(task, task);
  queue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
};

const withStore = async <T>(handler: (store: StoreShape) => T | Promise<T>): Promise<T> =>
  runExclusive(async () => {
    const store = await readStore();
    const result = await handler(store);
    await writeStore(store);
    return result;
  });

const withReadStore = async <T>(handler: (store: StoreShape) => T | Promise<T>): Promise<T> =>
  runExclusive(async () => {
    const store = await readStore();
    return handler(store);
  });

const sortByDateDesc = <T extends { createdAt: string }>(a: T, b: T) =>
  b.createdAt.localeCompare(a.createdAt);

const filterBySession = <T extends { sessionId: string | null }>(rows: T[], sessionId?: string) => {
  if (!sessionId) return rows;
  return rows.filter((row) => row.sessionId === sessionId);
};

const paginate = <T>(rows: T[], limit: number, offset: number) => ({
  items: rows.slice(offset, offset + limit),
  total: rows.length,
  limit,
  offset
});

export const nowIso = () => new Date().toISOString();

export const insertSnapshot = async (record: SnapshotRecord) =>
  withStore((store) => {
    store.snapshots.push(record);
    return record;
  });

export const listSnapshots = async ({ limit, offset, sessionId }: PaginationOptions) =>
  withReadStore((store) => {
    const filtered = filterBySession(store.snapshots, sessionId);
    return paginate([...filtered].sort(sortByDateDesc), limit, offset);
  });

export const getSnapshot = async (id: string) =>
  withReadStore((store) => store.snapshots.find((item) => item.id === id) ?? null);

export const deleteSnapshot = async (id: string) =>
  withStore((store) => {
    const index = store.snapshots.findIndex((item) => item.id === id);
    if (index === -1) return null;
    const [snapshot] = store.snapshots.splice(index, 1);
    return snapshot;
  });

export const insertMetric = async (record: MetricsRecord) =>
  withStore((store) => {
    store.metrics.push(record);
    return record;
  });

export const listMetrics = async ({ limit, offset, sessionId }: PaginationOptions) =>
  withReadStore((store) => {
    const filtered = filterBySession(store.metrics, sessionId);
    return paginate([...filtered].sort(sortByDateDesc), limit, offset);
  });

export const listRecentMetrics = async () =>
  withReadStore((store) => [...store.metrics].sort(sortByDateDesc).slice(0, 20));

export const getMetricsSummary = async (sessionId?: string) =>
  withReadStore((store) => {
    const scopedMetrics = filterBySession(store.metrics, sessionId);
    const total = scopedMetrics.length;
    const avgFps = total ? scopedMetrics.reduce((sum, item) => sum + item.fps, 0) / total : 0;

    const qualityRows = scopedMetrics.filter((item) => typeof item.qualityScore === 'number');
    const avgQualityScore = qualityRows.length
      ? qualityRows.reduce((sum, item) => sum + (item.qualityScore ?? 0), 0) / qualityRows.length
      : 0;

    const lastEventAt = scopedMetrics
      .map((item) => item.createdAt)
      .sort()
      .at(-1) ?? null;

    return {
      total,
      avgFps,
      avgQualityScore,
      lastEventAt
    };
  });

export const listMetricsTimeline = async (limit: number, sessionId?: string) =>
  withReadStore((store) =>
    filterBySession(store.metrics, sessionId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(-limit)
      .map((item) => ({
        id: item.id,
        createdAt: item.createdAt,
        fps: item.fps,
        qualityScore: item.qualityScore,
        sessionId: item.sessionId
      }))
  );
