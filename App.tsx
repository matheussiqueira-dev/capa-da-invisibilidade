import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CloakCanvas from './components/CloakCanvas';
import ControlPanel from './components/ControlPanel';
import Assistant from './components/Assistant';
import ServerPanel from './components/ServerPanel';
import { ProcessingConfig, SceneMetrics } from './types';
import { getSceneAdvice } from './services/sceneAdvisor';
import {
  getApiConfig,
  saveSnapshot,
  sendMetrics,
  listSnapshots,
  fetchMetricsSummary,
  ApiSnapshotItem
} from './services/apiClient';

const DEFAULT_CONFIG: ProcessingConfig = {
  targetHue: 0,
  hueThreshold: 15,
  satThreshold: 40,
  valThreshold: 20,
  edgeSoftness: 30,
  targetFps: 30
};

const createSessionId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}`;
};

const App: React.FC = () => {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [sceneMetrics, setSceneMetrics] = useState<SceneMetrics | null>(null);
  const [triggerCapture, setTriggerCapture] = useState(0);
  const [triggerSnapshot, setTriggerSnapshot] = useState(0);
  const [triggerUpload, setTriggerUpload] = useState(0);
  const [isPickingColor, setIsPickingColor] = useState(false);
  const [config, setConfig] = useState<ProcessingConfig>(DEFAULT_CONFIG);
  const [fps, setFps] = useState(0);
  const [metricsEnabled, setMetricsEnabled] = useState(true);
  const [snapshotStatus, setSnapshotStatus] = useState<'idle' | 'sending' | 'success' | 'error' | 'disabled'>(
    'idle'
  );
  const [metricsStatus, setMetricsStatus] = useState<'idle' | 'sending' | 'success' | 'error' | 'disabled'>(
    'idle'
  );
  const [lastSnapshotAt, setLastSnapshotAt] = useState<string | null>(null);
  const [lastMetricsAt, setLastMetricsAt] = useState<string | null>(null);
  const [history, setHistory] = useState<ApiSnapshotItem[]>([]);
  const [summary, setSummary] = useState<{ total: number; avgFps: number; lastEventAt: string | null } | null>(
    null
  );
  const [apiError, setApiError] = useState<string | null>(null);

  const apiConfig = useMemo(() => getApiConfig(), []);
  const apiReady = apiConfig.enabled && apiConfig.apiKey.length > 0;
  const sessionId = useMemo(() => createSessionId(), []);

  const advice = useMemo(() => (sceneMetrics ? getSceneAdvice(sceneMetrics) : null), [sceneMetrics]);
  const isLive = Boolean(backgroundImage);

  const configRef = useRef(config);
  const sceneRef = useRef(sceneMetrics);
  const fpsRef = useRef(0);
  const metricsBusyRef = useRef(false);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    sceneRef.current = sceneMetrics;
  }, [sceneMetrics]);

  useEffect(() => {
    fpsRef.current = fps;
  }, [fps]);

  const refreshHistory = useCallback(async () => {
    if (!apiReady) return;
    try {
      const { items } = await listSnapshots(5);
      setHistory(items);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Falha ao carregar historico.');
    }
  }, [apiReady]);

  const refreshSummary = useCallback(async () => {
    if (!apiReady) return;
    try {
      const data = await fetchMetricsSummary();
      setSummary(data);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Falha ao carregar metricas.');
    }
  }, [apiReady]);

  useEffect(() => {
    if (!apiReady) return;
    refreshHistory();
    refreshSummary();
  }, [apiReady, refreshHistory, refreshSummary]);

  useEffect(() => {
    if (!apiReady || !metricsEnabled) {
      setMetricsStatus(apiReady ? 'idle' : 'disabled');
      return;
    }

    const interval = window.setInterval(async () => {
      if (!isLive || fpsRef.current <= 0 || metricsBusyRef.current) {
        return;
      }
      metricsBusyRef.current = true;
      setMetricsStatus('sending');
      try {
        await sendMetrics({
          sessionId,
          fps: fpsRef.current,
          config: configRef.current,
          scene: sceneRef.current,
          client: {
            userAgent: navigator.userAgent,
            language: navigator.language
          }
        });
        setMetricsStatus('success');
        setLastMetricsAt(new Date().toISOString());
        await refreshSummary();
      } catch (error) {
        setMetricsStatus('error');
        setApiError(error instanceof Error ? error.message : 'Falha ao enviar metricas.');
      } finally {
        metricsBusyRef.current = false;
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [apiReady, metricsEnabled, isLive, sessionId, refreshSummary]);

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

  const handleUploadSnapshot = useCallback(() => {
    if (!apiReady) {
      setSnapshotStatus('disabled');
      setApiError('API desativada ou chave ausente.');
      return;
    }
    setSnapshotStatus('sending');
    setApiError(null);
    setTriggerUpload((prev) => prev + 1);
  }, [apiReady]);

  const handleSnapshotCaptured = useCallback(
    async (dataUrl: string) => {
      if (!apiReady) return;
      try {
        await saveSnapshot({
          imageBase64: dataUrl,
          mimeType: 'image/png',
          width: 640,
          height: 480,
          config: configRef.current,
          scene: sceneRef.current,
          note: 'Snapshot manual'
        });
        setSnapshotStatus('success');
        setLastSnapshotAt(new Date().toISOString());
        await refreshHistory();
      } catch (error) {
        setSnapshotStatus('error');
        setApiError(error instanceof Error ? error.message : 'Falha ao enviar snapshot.');
      }
    },
    [apiReady, refreshHistory]
  );

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

  const handleToggleMetrics = useCallback(() => {
    setMetricsEnabled((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    setBackgroundImage(null);
    setSceneMetrics(null);
    setTriggerCapture(0);
    setTriggerSnapshot(0);
    setTriggerUpload(0);
    setIsPickingColor(false);
    setConfig(DEFAULT_CONFIG);
    setFps(0);
    setSnapshotStatus('idle');
    setMetricsStatus('idle');
    setLastSnapshotAt(null);
    setLastMetricsAt(null);
    setApiError(null);
  }, []);

  const handleFpsSample = useCallback((value: number) => {
    setFps(value);
  }, []);

  return (
    <div className="app">
      <div className="container">
        <header className="hero">
          <div>
            <span className="hero-badge">Laboratorio visual em tempo real</span>
            <h1 className="hero-title">Invisibility Cloak Studio</h1>
            <p className="hero-description">
              Efeito de manto da invisibilidade com visao computacional no navegador. Ajuste a cor
              alvo, refine o recorte e sincronize resultados com o backend.
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
              <div className="metric-card">
                <div className="metric-label">FPS alvo</div>
                <div className="metric-value">{config.targetFps}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="studio">
          <section className="canvas-card">
            <div className="canvas-header">
              <h2 className="canvas-title">Studio View</h2>
              <p className="canvas-subtitle">
                Visualizacao ao vivo do recorte. Capture o fundo, ajuste matiz e envie snapshots.
              </p>
            </div>
            <CloakCanvas
              config={config}
              onBackgroundCaptured={handleBackgroundCaptured}
              triggerCapture={triggerCapture}
              triggerSnapshot={triggerSnapshot}
              triggerUpload={triggerUpload}
              isPickingColor={isPickingColor}
              onColorPicked={handleColorPicked}
              onSnapshotCaptured={handleSnapshotCaptured}
              onFpsSample={handleFpsSample}
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

            <Assistant advice={advice} hasBackground={isLive} onApplyRecommendation={handleApplyRecommendation} />

            <ServerPanel
              enabled={apiConfig.enabled}
              apiKeyPresent={apiConfig.apiKey.length > 0}
              baseUrl={apiConfig.baseUrl}
              snapshotStatus={snapshotStatus}
              metricsStatus={metricsStatus}
              lastSnapshotAt={lastSnapshotAt}
              lastMetricsAt={lastMetricsAt}
              metricsEnabled={metricsEnabled}
              fps={fps}
              summary={summary}
              history={history}
              error={apiError}
              onSendSnapshot={handleUploadSnapshot}
              onToggleMetrics={handleToggleMetrics}
              onRefresh={() => {
                refreshHistory();
                refreshSummary();
              }}
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
