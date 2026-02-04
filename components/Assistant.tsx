import React from 'react';
import type { SceneAdvice } from '../types';

interface AssistantProps {
  advice: SceneAdvice | null;
  hasBackground: boolean;
  onApplyRecommendation: () => void;
}

const Assistant: React.FC<AssistantProps> = ({ advice, hasBackground, onApplyRecommendation }) => {
  return (
    <div className="panel">
      <div>
        <h3 className="panel-title">Insights de Cena</h3>
        <p className="panel-subtitle">Analise local e recomendacoes visuais para um recorte mais limpo.</p>
      </div>

      {!hasBackground ? (
        <p className="panel-subtitle">Capture o fundo para gerar o diagnostico automatico da cena.</p>
      ) : (
        <>
          <div className="insight-grid">
            <div className="insight-card">
              <span className="metric-label">Luz</span>
              <strong>{advice?.lightingLabel ?? '---'}</strong>
            </div>
            <div className="insight-card">
              <span className="metric-label">Textura</span>
              <strong>{advice?.textureLabel ?? '---'}</strong>
            </div>
            <div className="insight-card">
              <span className="metric-label">Resumo</span>
              <strong>{advice?.summary ?? '---'}</strong>
            </div>
          </div>

          <div className="inline-row">
            <div
              className="swatch"
              style={{ backgroundColor: `hsl(${advice?.recommendedHue ?? 0}, 90%, 55%)` }}
              aria-hidden
            />
            <div>
              <div className="metric-label">Cor recomendada</div>
              <div className="metric-value">{advice?.recommendedName ?? '---'}</div>
            </div>
            <button
              type="button"
              className="button button--secondary"
              onClick={onApplyRecommendation}
              disabled={!advice}
            >
              Aplicar cor
            </button>
          </div>

          <ul className="list">
            {advice?.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </>
      )}

      <details className="details">
        <summary>Como o manto funciona</summary>
        <p className="panel-subtitle">
          O sistema compara a matiz do tecido com a cor alvo. Pixels que entram no intervalo de cor sao
          substituidos pelo fundo capturado, criando o efeito de invisibilidade em tempo real.
        </p>
      </details>
    </div>
  );
};

export default Assistant;
