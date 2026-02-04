import React from 'react';
import type { ApiSnapshotItem } from '../services/apiClient';

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
  summary: { total: number; avgFps: number; lastEventAt: string | null } | null;
  history: ApiSnapshotItem[];
  error: string | null;
  onSendSnapshot: () => void;
  onToggleMetrics: () => void;
  onRefresh: () => void;
}

const formatDate = (value: string | null) => {
  if (!value) return '---';
  const date = new Date(value);
  return date.toLocaleString();
};

const buildFileUrl = (baseUrl: string, path: string) => {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBase}${path}`;
};

const statusLabel = (status: ServerPanelProps['snapshotStatus']) => {
  switch (status) {
    case 'sending':
      return { label: 'Enviando', tone: 'warn' };
    case 'success':
      return { label: 'Sincronizado', tone: 'ok' };
    case 'error':
      return { label: 'Erro', tone: 'error' };
    case 'disabled':
      return { label: 'Desativado', tone: 'neutral' };
    default:
      return { label: 'Aguardando', tone: 'neutral' };
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
  error,
  onSendSnapshot,
  onToggleMetrics,
  onRefresh
}) => {
  const snapshotBadge = statusLabel(snapshotStatus);
  const metricsBadge = statusLabel(metricsStatus);

  return (
    <div className="panel">
      <div>
        <h3 className="panel-title">Conexao com API</h3>
        <p className="panel-subtitle">Sincronize snapshots e acompanhe metricas do efeito.</p>
      </div>

      <div className="status-grid">
        <div className="status-card">
          <span className="metric-label">Status</span>
          <div className={`status-tag is-${enabled ? 'ok' : 'neutral'}`}>
            {enabled ? 'Ativa' : 'Desativada'}
          </div>
          <span className="status-caption">Endpoint: {baseUrl}</span>
        </div>
        <div className="status-card">
          <span className="metric-label">API Key</span>
          <div className={`status-tag is-${apiKeyPresent ? 'ok' : 'error'}`}>
            {apiKeyPresent ? 'Configurada' : 'Ausente'}
          </div>
          <span className="status-caption">Use o .env para informar a chave.</span>
        </div>
        <div className="status-card">
          <span className="metric-label">FPS Atual</span>
          <div className="metric-value">{fps || 0}</div>
          <span className="status-caption">Baseado no processamento real.</span>
        </div>
      </div>

      <div className="button-row">
        <button
          type="button"
          className="button button--primary"
          onClick={onSendSnapshot}
          disabled={!enabled || !apiKeyPresent || snapshotStatus === 'sending'}
        >
          Enviar snapshot
        </button>
        <button type="button" className="button button--secondary" onClick={onRefresh}>
          Atualizar historico
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
          <span className="metric-label">Media FPS</span>
          <div className="metric-value">{summary?.avgFps ?? 0}</div>
          <span className="status-caption">Total eventos: {summary?.total ?? 0}</span>
        </div>
      </div>

      {error && <div className="status-error">{error}</div>}

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
                  <div className="metric-value">{item.id.slice(0, 8)}</div>
                  <div className="status-caption">{formatDate(item.createdAt)}</div>
                </div>
                <a
                  className="history-link"
                  href={buildFileUrl(baseUrl, item.fileUrl)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ServerPanel;
