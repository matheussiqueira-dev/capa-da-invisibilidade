import React from 'react';
import type { ApiMetricsTimelineItem, ApiSnapshotItem } from '../services/apiClient';

interface ServerPanelProps {
  enabled: boolean;
  apiKeyPresent: boolean;
  baseUrl: string;
  snapshotStatus: 'idle' | 'sending' | 'success' | 'error' | 'disabled';
  metricsStatus: 'idle' | 'sending' | 'success' | 'error' | 'disabled';
  lastSnapshotAt: string | null;
  lastMetricsAt: string | null;
  metricsEnabled: boolean;
  fps: number;
  summary: { total: number; avgFps: number; avgQualityScore: number; lastEventAt: string | null } | null;
  history: ApiSnapshotItem[];
  timeline: ApiMetricsTimelineItem[];
  error: string | null;
  onSendSnapshot: () => void;
  onDeleteSnapshot: (id: string) => void;
  onToggleMetrics: () => void;
  onRefresh: () => void;
}

const formatDate = (value: string | null) => {
  if (!value) return '---';
  const date = new Date(value);
  return date.toLocaleString();
};

const buildFileUrl = (baseUrl: string, resourcePath: string) => {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBase}${resourcePath}`;
};

const statusLabel = (status: ServerPanelProps['snapshotStatus']) => {
  switch (status) {
    case 'sending':
      return { label: 'Enviando', tone: 'warn' as const };
    case 'success':
      return { label: 'Sincronizado', tone: 'ok' as const };
    case 'error':
      return { label: 'Erro', tone: 'error' as const };
    case 'disabled':
      return { label: 'Desativado', tone: 'neutral' as const };
    default:
      return { label: 'Aguardando', tone: 'neutral' as const };
  }
};

const ServerPanel: React.FC<ServerPanelProps> = ({
  enabled,
  apiKeyPresent,
  baseUrl,
  snapshotStatus,
  metricsStatus,
  lastSnapshotAt,
  lastMetricsAt,
  metricsEnabled,
  fps,
  summary,
  history,
  timeline,
  error,
  onSendSnapshot,
  onDeleteSnapshot,
  onToggleMetrics,
  onRefresh
}) => {
  const snapshotBadge = statusLabel(snapshotStatus);
  const metricsBadge = statusLabel(metricsStatus);
  const maxTimelineFps = Math.max(1, ...timeline.map((item) => item.fps));

  return (
    <section className="panel" aria-labelledby="api-panel-title">
      <div>
        <h3 id="api-panel-title" className="panel-title">
          Conexao com API
        </h3>
        <p className="panel-subtitle">Snapshots, metricas e telemetria remota da sessao.</p>
      </div>

      <div className="status-grid">
        <div className="status-card">
          <span className="metric-label">Status</span>
          <div className={`status-tag is-${enabled ? 'ok' : 'neutral'}`}>{enabled ? 'Ativa' : 'Desativada'}</div>
          <span className="status-caption">Endpoint: {baseUrl}</span>
        </div>
        <div className="status-card">
          <span className="metric-label">API Key</span>
          <div className={`status-tag is-${apiKeyPresent ? 'ok' : 'error'}`}>
            {apiKeyPresent ? 'Configurada' : 'Ausente'}
          </div>
          <span className="status-caption">Configure em `.env`.</span>
        </div>
        <div className="status-card">
          <span className="metric-label">FPS Atual</span>
          <div className="metric-value">{fps || 0}</div>
          <span className="status-caption">Amostra local em tempo real.</span>
        </div>
      </div>

      <div className="button-row">
        <button
          type="button"
          className="button button--primary"
          onClick={onSendSnapshot}
          disabled={!enabled || !apiKeyPresent || snapshotStatus === 'sending'}
        >
          Enviar snapshot (U)
        </button>
        <button type="button" className="button button--secondary" onClick={onRefresh}>
          Atualizar dados
        </button>
        <button
          type="button"
          className={`button toggle-button ${metricsEnabled ? 'is-active' : ''}`}
          onClick={onToggleMetrics}
          disabled={!enabled || !apiKeyPresent}
        >
          {metricsEnabled ? 'Metricas ativas' : 'Metricas pausadas'}
        </button>
      </div>

      <div className="status-grid">
        <div className="status-card">
          <span className="metric-label">Snapshots</span>
          <div className={`status-tag is-${snapshotBadge.tone}`}>{snapshotBadge.label}</div>
          <span className="status-caption">Ultimo envio: {formatDate(lastSnapshotAt)}</span>
        </div>
        <div className="status-card">
          <span className="metric-label">Metricas</span>
          <div className={`status-tag is-${metricsBadge.tone}`}>{metricsBadge.label}</div>
          <span className="status-caption">Ultimo envio: {formatDate(lastMetricsAt)}</span>
        </div>
        <div className="status-card">
          <span className="metric-label">Score Medio</span>
          <div className="metric-value">{summary?.avgQualityScore ?? 0}</div>
          <span className="status-caption">FPS medio: {summary?.avgFps ?? 0}</span>
        </div>
      </div>

      <div className="status-caption">Ultimo evento registrado: {formatDate(summary?.lastEventAt ?? null)}</div>

      {error && <div className="status-error">{error}</div>}

      <div className="chart">
        <div className="metric-label">Timeline remota de FPS</div>
        {timeline.length === 0 ? (
          <p className="panel-subtitle">Sem eventos recentes no backend.</p>
        ) : (
          <div className="chart-bars" role="img" aria-label="Grafico de FPS remoto">
            {timeline.map((item, index) => (
              <span
                key={`${item.createdAt}-${index}`}
                className="chart-bar chart-bar--api"
                style={{ height: `${Math.max(10, (item.fps / maxTimelineFps) * 100)}%` }}
                title={`${new Date(item.createdAt).toLocaleTimeString()} - ${item.fps} FPS`}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="inline-row">
          <h4 className="panel-title">Historico remoto</h4>
          <span className="status-tag is-neutral">{history.length} itens</span>
        </div>
        <div className="history-list">
          {history.length === 0 ? (
            <p className="panel-subtitle">Nenhum snapshot salvo ainda.</p>
          ) : (
            history.map((item) => (
              <div key={item.id} className="history-item">
                <div>
                  <div className="metric-value">{item.note || item.id.slice(0, 8)}</div>
                  <div className="status-caption">{formatDate(item.createdAt)}</div>
                  <div className="status-caption">
                    Sessao: {item.sessionId ?? '---'} | Score: {item.qualityScore ?? '---'}
                  </div>
                </div>
                <div className="inline-row">
                  <a
                    className="history-link"
                    href={buildFileUrl(baseUrl, item.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir
                  </a>
                  <button
                    type="button"
                    className="button button--danger button--tiny"
                    onClick={() => onDeleteSnapshot(item.id)}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default ServerPanel;
