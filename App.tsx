import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Assistant from './components/Assistant';
import CloakCanvas from './components/CloakCanvas';
import ControlPanel from './components/ControlPanel';
import PerformancePanel from './components/PerformancePanel';
import PresetManager from './components/PresetManager';
import ServerPanel from './components/ServerPanel';
import { usePersistentState } from './hooks/usePersistentState';
import {
  deleteSnapshot,
  fetchMetricsSummary,
  fetchMetricsTimeline,
  getApiConfig,
  listSnapshots,
  saveSnapshot,
  sendMetrics
} from './services/apiClient';
import { getSceneAdvice } from './services/sceneAdvisor';
import type { CalibrationPreset, ProcessingConfig, SceneMetrics, TimelineSample } from './types';
import { computeQualityScore } from './utils/qualityScore';

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

const createPresetId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `preset-${Date.now()}`;
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
  const [history, setHistory] = useState<Awaited<ReturnType<typeof listSnapshots>>['items']>([]);
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof fetchMetricsSummary>> | null>(null);
  const [timeline, setTimeline] = useState<Awaited<ReturnType<typeof fetchMetricsTimeline>>['items']>([]);
  const [localTimeline, setLocalTimeline] = useState<TimelineSample[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('Aplicacao inicializada.');
  const [presets, setPresets] = usePersistentState<CalibrationPreset[]>('cloak:presets:v1', []);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const apiConfig = useMemo(() => getApiConfig(), []);
  const apiReady = apiConfig.enabled && apiConfig.apiKey.length > 0;
  const sessionId = useMemo(() => createSessionId(), []);

  const advice = useMemo(() => (sceneMetrics ? getSceneAdvice(sceneMetrics) : null), [sceneMetrics]);
  const quality = useMemo(() => computeQualityScore(fps, config.targetFps, sceneMetrics), [fps, config.targetFps, sceneMetrics]);
  const isLive = Boolean(backgroundImage);

  const configRef = useRef(config);
  const sceneRef = useRef(sceneMetrics);
  const fpsRef = useRef(0);
  const qualityRef = useRef(quality.score);
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

  useEffect(() => {
    qualityRef.current = quality.score;
  }, [quality.score]);

  useEffect(() => {
    if (fps <= 0) return;
    setLocalTimeline((prev) => {
      const next = [
        ...prev,
        {
          createdAt: new Date().toISOString(),
          fps,
          qualityScore: quality.score
        }
      ];
      return next.slice(-36);
    });
  }, [fps, quality.score]);

  useEffect(() => {
    if (!apiReady) {
      setSnapshotStatus('disabled');
      setMetricsStatus('disabled');
      return;
    }
    setSnapshotStatus('idle');
    setMetricsStatus(metricsEnabled ? 'idle' : 'disabled');
  }, [apiReady, metricsEnabled]);

  const refreshHistory = useCallback(async () => {
    if (!apiReady) return;
    try {
      const { items } = await listSnapshots(6, 0, sessionId);
      setHistory(items);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Falha ao carregar historico.');
    }
  }, [apiReady, sessionId]);

  const refreshSummary = useCallback(async () => {
    if (!apiReady) return;
    try {
      const data = await fetchMetricsSummary(sessionId);
      setSummary(data);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Falha ao carregar metricas.');
    }
  }, [apiReady, sessionId]);

  const refreshTimeline = useCallback(async () => {
    if (!apiReady) return;
    try {
      const data = await fetchMetricsTimeline(24, sessionId);
      setTimeline(data.items);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Falha ao carregar timeline.');
    }
  }, [apiReady, sessionId]);

  useEffect(() => {
    if (!apiReady) return;
    void refreshHistory();
    void refreshSummary();
    void refreshTimeline();
  }, [apiReady, refreshHistory, refreshSummary, refreshTimeline]);

  useEffect(() => {
    if (!apiReady || !metricsEnabled) {
      setMetricsStatus(apiReady ? 'idle' : 'disabled');
      return;
    }

    const interval = window.setInterval(async () => {
      if (!isLive || fpsRef.current <= 0 || metricsBusyRef.current) return;

      metricsBusyRef.current = true;
      setMetricsStatus('sending');
      try {
        await sendMetrics({
          sessionId,
          fps: fpsRef.current,
          qualityScore: qualityRef.current,
          config: configRef.current,
          scene: sceneRef.current,
          client: {
            userAgent: navigator.userAgent,
            language: navigator.language
          }
        });
        setMetricsStatus('success');
        setLastMetricsAt(new Date().toISOString());
        void refreshSummary();
        void refreshTimeline();
      } catch (error) {
        setMetricsStatus('error');
        setApiError(error instanceof Error ? error.message : 'Falha ao enviar metricas.');
      } finally {
        metricsBusyRef.current = false;
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [apiReady, metricsEnabled, isLive, sessionId, refreshSummary, refreshTimeline]);

  const handleCaptureBackground = useCallback(() => {
    setTriggerCapture((prev) => prev + 1);
    setIsPickingColor(false);
    setAnnouncement('Captura de fundo iniciada.');
  }, []);

  const handleBackgroundCaptured = useCallback((dataUrl: string, metrics: SceneMetrics) => {
    setBackgroundImage(dataUrl);
    setSceneMetrics(metrics);
    setAnnouncement('Fundo capturado com sucesso.');
  }, []);

  const handleSnapshot = useCallback(() => {
    setTriggerSnapshot((prev) => prev + 1);
    setAnnouncement('Snapshot local salvo.');
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
          sessionId,
          qualityScore: qualityRef.current,
          config: configRef.current,
          scene: sceneRef.current,
          note: `Snapshot (${quality.label})`
        });
        setSnapshotStatus('success');
        setLastSnapshotAt(new Date().toISOString());
        setAnnouncement('Snapshot enviado ao backend.');
        await refreshHistory();
      } catch (error) {
        setSnapshotStatus('error');
        setApiError(error instanceof Error ? error.message : 'Falha ao enviar snapshot.');
      }
    },
    [apiReady, quality.label, refreshHistory, sessionId]
  );

  const handleDeleteSnapshot = useCallback(
    async (id: string) => {
      if (!apiReady) return;
      try {
        await deleteSnapshot(id);
        setHistory((prev) => prev.filter((item) => item.id !== id));
        setAnnouncement('Snapshot removido do backend.');
      } catch (error) {
        setApiError(error instanceof Error ? error.message : 'Falha ao remover snapshot.');
      }
    },
    [apiReady]
  );

  const handleTogglePickColor = useCallback(() => {
    setIsPickingColor((prev) => !prev);
  }, []);

  const handleColorPicked = useCallback((hue: number) => {
    setConfig((prev) => ({ ...prev, targetHue: hue }));
    setIsPickingColor(false);
    setAnnouncement('Cor alvo atualizada.');
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
    setSnapshotStatus(apiReady ? 'idle' : 'disabled');
    setMetricsStatus(apiReady ? 'idle' : 'disabled');
    setLastSnapshotAt(null);
    setLastMetricsAt(null);
    setApiError(null);
    setLocalTimeline([]);
    setAnnouncement('Sessao reiniciada.');
  }, [apiReady]);

  const handleSavePreset = useCallback(
    (name: string) => {
      const preset: CalibrationPreset = {
        id: createPresetId(),
        name,
        createdAt: new Date().toISOString(),
        config
      };

      setPresets((prev) => [preset, ...prev].slice(0, 12));
      setActivePresetId(preset.id);
      setAnnouncement(`Preset "${name}" salvo.`);
    },
    [config, setPresets]
  );

  const handleApplyPreset = useCallback(
    (presetId: string) => {
      const preset = presets.find((item) => item.id === presetId);
      if (!preset) return;
      setConfig(preset.config);
      setActivePresetId(preset.id);
      setAnnouncement(`Preset "${preset.name}" aplicado.`);
    },
    [presets]
  );

  const handleDeletePreset = useCallback(
    (presetId: string) => {
      setPresets((prev) => prev.filter((item) => item.id !== presetId));
      setActivePresetId((current) => (current === presetId ? null : current));
    },
    [setPresets]
  );

  const handleFpsSample = useCallback((value: number) => {
    setFps(value);
  }, []);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      const key = event.key.toLowerCase();
      if (key === 'b') {
        event.preventDefault();
        handleCaptureBackground();
      }
      if (key === 's' && isLive) {
        event.preventDefault();
        handleSnapshot();
      }
      if (key === 'u' && isLive) {
        event.preventDefault();
        handleUploadSnapshot();
      }
      if (key === 'p') {
        event.preventDefault();
        handleTogglePickColor();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [handleCaptureBackground, handleSnapshot, handleTogglePickColor, handleUploadSnapshot, isLive]);

  const flowSteps = [
    { label: '1. Capturar fundo sem pessoa na cena', completed: isLive },
    { label: '2. Ajustar cor alvo ou usar captura por clique', completed: isLive && !isPickingColor },
    { label: '3. Monitorar score de qualidade e FPS', completed: fps > 0 },
    { label: '4. Enviar snapshot e metricas para auditoria', completed: Boolean(lastSnapshotAt || lastMetricsAt) }
  ];

  return (
    <div className="app">
      <div className="container">
        <header className="hero">
          <div>
            <span className="hero-badge">Computer Vision Lab</span>
            <h1 className="hero-title">Invisibility Cloak Studio Pro</h1>
            <p className="hero-description">
              Pipeline de recorte em tempo real com diagnostico visual, presets reutilizaveis e telemetria para
              operacao em ambiente de producao.
            </p>
          </div>

          <div className="hero-card">
            <div className="status-pill">
              <span className={`status-dot ${isLive ? 'is-live' : ''}`} />
              <span>{isLive ? 'Efeito ativo' : 'Aguardando captura de fundo'}</span>
            </div>
            <div className="hero-metrics">
              <div className="metric-card">
                <div className="metric-label">Matiz alvo</div>
                <div className="metric-value">{Math.round(config.targetHue)} deg</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">FPS atual</div>
                <div className="metric-value">{fps}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Qualidade</div>
                <div className="metric-value">{quality.score}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Sessao</div>
                <div className="metric-value">{sessionId.slice(0, 8)}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="studio">
          <section className="workspace">
            <section className="canvas-card">
              <div className="canvas-header">
                <h2 className="canvas-title">Studio View</h2>
                <p className="canvas-subtitle">
                  Captura local em Canvas com recorte por matiz, suavizacao de borda e ajuste fino da mascara.
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

            <PerformancePanel
              isLive={isLive}
              fps={fps}
              targetFps={config.targetFps}
              quality={quality}
              timeline={localTimeline}
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

            <PresetManager
              presets={presets}
              activePresetId={activePresetId}
              onSavePreset={handleSavePreset}
              onApplyPreset={handleApplyPreset}
              onDeletePreset={handleDeletePreset}
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
              timeline={timeline}
              history={history}
              error={apiError}
              onSendSnapshot={handleUploadSnapshot}
              onDeleteSnapshot={handleDeleteSnapshot}
              onToggleMetrics={handleToggleMetrics}
              onRefresh={() => {
                void refreshHistory();
                void refreshSummary();
                void refreshTimeline();
              }}
            />

            <section className="panel">
              <div>
                <h3 className="panel-title">Fluxo de Operacao</h3>
                <p className="panel-subtitle">Checklist rapido para manter consistencia do efeito.</p>
              </div>
              <ol className="list list--steps">
                {flowSteps.map((step) => (
                  <li key={step.label} className={step.completed ? 'is-complete' : ''}>
                    <span className="step-dot" aria-hidden />
                    <span>{step.label}</span>
                  </li>
                ))}
              </ol>
              {backgroundImage && (
                <div>
                  <p className="panel-subtitle">Referencia do fundo capturado:</p>
                  <img className="preview" src={backgroundImage} alt="Fundo capturado para efeito de invisibilidade" />
                </div>
              )}
            </section>
          </aside>
        </main>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
};

export default App;
