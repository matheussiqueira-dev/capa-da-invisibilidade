import type { ProcessingConfig, SceneMetrics } from '../types';

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
  sessionId: string | null;
  qualityScore: number | null;
  note: string | null;
};

export type ApiMetricsResponse = {
  id: string;
  createdAt: string;
};

export type ApiMetricsSummary = {
  total: number;
  avgFps: number;
  avgQualityScore: number;
  lastEventAt: string | null;
  sessionId: string | null;
};

export type ApiMetricsTimelineItem = {
  id: string;
  createdAt: string;
  fps: number;
  qualityScore: number | null;
  sessionId: string | null;
};

const REQUEST_TIMEOUT_MS = 12_000;

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

const buildQueryString = (query: Record<string, string | number | null | undefined>) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
};

const request = async <T>(path: string, options: RequestInit, expectJson = true): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const { baseUrl } = getApiConfig();
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      signal: controller.signal
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const requestId = payload?.requestId ? ` (requestId: ${payload.requestId})` : '';
      const message = payload?.message || `Request failed (${response.status})${requestId}`;
      throw new Error(message);
    }

    if (!expectJson || response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export const saveSnapshot = async (payload: {
  imageBase64: string;
  mimeType?: string;
  width?: number;
  height?: number;
  sessionId?: string;
  qualityScore?: number;
  config?: ProcessingConfig;
  scene?: SceneMetrics | null;
  note?: string;
}): Promise<ApiSnapshotResponse> =>
  request<ApiSnapshotResponse>('/api/v1/snapshots', {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload)
  });

export const listSnapshots = async (
  limit = 5,
  offset = 0,
  sessionId?: string
): Promise<{
  items: ApiSnapshotItem[];
  meta: { limit: number; offset: number; total: number; sessionId: string | null };
}> =>
  request(`/api/v1/snapshots${buildQueryString({ limit, offset, sessionId })}`, {
    method: 'GET',
    headers: buildHeaders()
  });

export const deleteSnapshot = async (id: string): Promise<void> =>
  request<void>(
    `/api/v1/snapshots/${id}`,
    {
      method: 'DELETE',
      headers: buildHeaders()
    },
    false
  );

export const sendMetrics = async (payload: {
  sessionId?: string;
  fps: number;
  qualityScore?: number;
  config?: ProcessingConfig;
  scene?: SceneMetrics | null;
  client?: Record<string, unknown>;
}): Promise<ApiMetricsResponse> =>
  request<ApiMetricsResponse>('/api/v1/metrics', {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload)
  });

export const fetchMetricsSummary = async (sessionId?: string): Promise<ApiMetricsSummary> =>
  request<ApiMetricsSummary>(`/api/v1/metrics/summary${buildQueryString({ sessionId })}`, {
    method: 'GET',
    headers: buildHeaders()
  });

export const fetchMetricsTimeline = async (
  limit = 30,
  sessionId?: string
): Promise<{ items: ApiMetricsTimelineItem[]; meta: { limit: number; sessionId: string | null } }> =>
  request(`/api/v1/metrics/timeline${buildQueryString({ limit, sessionId })}`, {
    method: 'GET',
    headers: buildHeaders()
  });
