import React, { useCallback, useMemo, useState } from 'react';
import CloakCanvas from './components/CloakCanvas';
import ControlPanel from './components/ControlPanel';
import Assistant from './components/Assistant';
import { ProcessingConfig, SceneMetrics } from './types';
import { getSceneAdvice } from './services/sceneAdvisor';

const DEFAULT_CONFIG: ProcessingConfig = {
  targetHue: 0,
  hueThreshold: 15,
  satThreshold: 40,
  valThreshold: 20,
  edgeSoftness: 30
};

const App: React.FC = () => {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [sceneMetrics, setSceneMetrics] = useState<SceneMetrics | null>(null);
  const [triggerCapture, setTriggerCapture] = useState(0);
  const [triggerSnapshot, setTriggerSnapshot] = useState(0);
  const [isPickingColor, setIsPickingColor] = useState(false);
  const [config, setConfig] = useState<ProcessingConfig>(DEFAULT_CONFIG);

  const advice = useMemo(() => (sceneMetrics ? getSceneAdvice(sceneMetrics) : null), [sceneMetrics]);

  const handleCaptureBackground = useCallback(() => {
    setTriggerCapture((prev) => prev + 1);
    setIsPickingColor(false);
  }, []);

  const handleBackgroundCaptured = useCallback((dataUrl: string, metrics: SceneMetrics) => {
    setBackgroundImage(dataUrl);
    setSceneMetrics(metrics);
  }, []);

  const handleSnapshot = useCallback(() => {
    setTriggerSnapshot((prev) => prev + 1);
  }, []);

  const handleTogglePickColor = useCallback(() => {
    setIsPickingColor((prev) => !prev);
  }, []);

  const handleColorPicked = useCallback((hue: number) => {
    setConfig((prev) => ({ ...prev, targetHue: hue }));
    setIsPickingColor(false);
  }, []);

  const handleApplyRecommendation = useCallback(() => {
    if (!advice) return;
    setConfig((prev) => ({ ...prev, targetHue: advice.recommendedHue }));
  }, [advice]);

  const handleReset = useCallback(() => {
    setBackgroundImage(null);
    setSceneMetrics(null);
    setTriggerCapture(0);
    setTriggerSnapshot(0);
    setIsPickingColor(false);
    setConfig(DEFAULT_CONFIG);
  }, []);

  const isLive = Boolean(backgroundImage);

  return (
    <div className="app">
      <div className="container">
        <header className="hero">
          <div>
            <span className="hero-badge">Laboratorio visual em tempo real</span>
            <h1 className="hero-title">Invisibility Cloak Studio</h1>
            <p className="hero-description">
              Efeito de manto da invisibilidade com visao computacional no navegador. Ajuste a cor
              alvo, refine o recorte e crie a ilusao sem depender de servidores externos.
            </p>
          </div>

          <div className="hero-card">
            <div className="status-pill">
              <span className={`status-dot ${isLive ? 'is-live' : ''}`} />
              <span>{isLive ? 'Efeito ativo' : 'Pronto para capturar'}</span>
            </div>
            <div className="hero-metrics">
              <div className="metric-card">
                <div className="metric-label">Matiz alvo</div>
                <div className="metric-value">{Math.round(config.targetHue)} deg</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Tolerancia</div>
                <div className="metric-value">±{config.hueThreshold}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Suavizacao</div>
                <div className="metric-value">{config.edgeSoftness}%</div>
              </div>
            </div>
          </div>
        </header>

        <main className="studio">
          <section className="canvas-card">
            <div className="canvas-header">
              <h2 className="canvas-title">Studio View</h2>
              <p className="canvas-subtitle">
                Visualizacao ao vivo do recorte. Ative a captura de cor para ajustar com um clique.
              </p>
            </div>
            <CloakCanvas
              config={config}
              onBackgroundCaptured={handleBackgroundCaptured}
              triggerCapture={triggerCapture}
              triggerSnapshot={triggerSnapshot}
              isPickingColor={isPickingColor}
              onColorPicked={handleColorPicked}
            />
          </section>

          <aside className="panel-stack">
            <ControlPanel
              config={config}
              setConfig={setConfig}
              onCaptureBackground={handleCaptureBackground}
              onSnapshot={handleSnapshot}
              onReset={handleReset}
              hasBackground={isLive}
              isPickingColor={isPickingColor}
              onTogglePickColor={handleTogglePickColor}
            />

            <Assistant
              advice={advice}
              hasBackground={isLive}
              onApplyRecommendation={handleApplyRecommendation}
            />

            <div className="panel">
              <div>
                <h3 className="panel-title">Fluxo rapido</h3>
                <p className="panel-subtitle">Passo a passo para um efeito consistente.</p>
              </div>
              <ol className="list">
                <li>Permita a camera quando solicitado.</li>
                <li>Saia do quadro e capture o fundo.</li>
                <li>Volte com o tecido da cor alvo.</li>
                <li>Ajuste tolerancia e suavizacao conforme a luz.</li>
              </ol>
              {backgroundImage && (
                <div>
                  <p className="panel-subtitle">Referencia do fundo capturado:</p>
                  <img className="preview" src={backgroundImage} alt="Fundo capturado" />
                </div>
              )}
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default App;
