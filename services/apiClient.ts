import type { SceneMetrics, ProcessingConfig } from '../types';

export type ApiSnapshotResponse = {
  id: string;
  createdAt: string;
  fileUrl: string;
};

export type ApiSnapshotItem = {
  id: string;
  createdAt: string;
  fileUrl: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  note: string | null;
};

export type ApiMetricsResponse = {
  id: string;
  createdAt: string;
};

export const getApiConfig = () => ({
  enabled: import.meta.env.VITE_ENABLE_API === 'true',
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  apiKey: import.meta.env.VITE_API_KEY || ''
});

const buildHeaders = () => {
  const { apiKey } = getApiConfig();
  return {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey
  };
};

const request = async <T>(path: string, options: RequestInit): Promise<T> => {
  const { baseUrl } = getApiConfig();
  const response = await fetch(`${baseUrl}${path}`, options);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return response.json() as Promise<T>;
};

export const saveSnapshot = async (payload: {
  imageBase64: string;
  mimeType?: string;
  width?: number;
  height?: number;
  config?: ProcessingConfig;
  scene?: SceneMetrics | null;
  note?: string;
}): Promise<ApiSnapshotResponse> =>
  request<ApiSnapshotResponse>('/api/v1/snapshots', {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload)
  });

export const listSnapshots = async (limit = 5): Promise<{ items: ApiSnapshotItem[] }> =>
  request<{ items: ApiSnapshotItem[] }>(`/api/v1/snapshots?limit=${limit}`, {
    method: 'GET',
    headers: buildHeaders()
  });

export const sendMetrics = async (payload: {
  sessionId?: string;
  fps: number;
  config?: ProcessingConfig;
  scene?: SceneMetrics | null;
  client?: Record<string, unknown>;
}): Promise<ApiMetricsResponse> =>
  request<ApiMetricsResponse>('/api/v1/metrics', {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload)
  });

export const fetchMetricsSummary = async (): Promise<{
  total: number;
  avgFps: number;
  lastEventAt: string | null;
}> =>
  request('/api/v1/metrics/summary', {
    method: 'GET',
    headers: buildHeaders()
  });
