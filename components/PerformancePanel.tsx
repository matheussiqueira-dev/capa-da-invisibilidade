import React from 'react';
import type { SessionQuality, TimelineSample } from '../types';

interface PerformancePanelProps {
  isLive: boolean;
  fps: number;
  targetFps: number;
  quality: SessionQuality;
  timeline: TimelineSample[];
}

const buildTone = (quality: SessionQuality['label']) => {
  if (quality === 'Excelente') return 'ok';
  if (quality === 'Boa') return 'warn';
  if (quality === 'Regular') return 'warn';
  return 'error';
};

const PerformancePanel: React.FC<PerformancePanelProps> = ({ isLive, fps, targetFps, quality, timeline }) => {
  const tone = buildTone(quality.label);
  const maxFps = Math.max(targetFps, ...timeline.map((sample) => sample.fps), 1);

  return (
    <section className="panel" aria-labelledby="performance-title">
      <div className="panel-header">
        <div>
          <h3 id="performance-title" className="panel-title">
            Diagnostico da Sessao
          </h3>
          <p className="panel-subtitle">Qualidade do recorte e estabilidade de processamento.</p>
        </div>
        <div className={`status-tag is-${tone}`}>{quality.label}</div>
      </div>

      <div className="status-grid">
        <div className="status-card">
          <span className="metric-label">Sessao</span>
          <div className={`status-tag is-${isLive ? 'ok' : 'neutral'}`}>{isLive ? 'Ativa' : 'Em espera'}</div>
          <span className="status-caption">Fundo capturado: {isLive ? 'sim' : 'nao'}</span>
        </div>
        <div className="status-card">
          <span className="metric-label">FPS Atual</span>
          <div className="metric-value">{fps}</div>
          <span className="status-caption">Meta: {targetFps}</span>
        </div>
        <div className="status-card">
          <span className="metric-label">Score de Qualidade</span>
          <div className="metric-value">{quality.score}</div>
          <span className="status-caption">Escala de 0 a 100</span>
        </div>
      </div>

      <div className="chart">
        <div className="metric-label">Timeline local de FPS</div>
        {timeline.length === 0 ? (
          <p className="panel-subtitle">Inicie a captura para gerar amostras de desempenho.</p>
        ) : (
          <div className="chart-bars" role="img" aria-label="Grafico de barras de FPS local">
            {timeline.map((sample, index) => (
              <span
                key={`${sample.createdAt}-${index}`}
                className="chart-bar"
                style={{ height: `${Math.max(8, (sample.fps / maxFps) * 100)}%` }}
                title={`${new Date(sample.createdAt).toLocaleTimeString()} - ${sample.fps} FPS`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PerformancePanel;
