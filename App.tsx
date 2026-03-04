import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CloakCanvas from './components/CloakCanvas';
import { getSceneAdvice } from './services/sceneAdvisor';
import type { ProcessingConfig, SceneMetrics } from './types';
import { computeQualityScore } from './utils/qualityScore';

const DEFAULT_CONFIG: ProcessingConfig = {
  targetHue: 0,
  hueThreshold: 15,
  satThreshold: 40,
  valThreshold: 20,
  edgeSoftness: 30,
  targetFps: 30
};

const promptHuePresets = [
  { label: 'Verde esmeralda', hue: 120, keywords: ['verde', 'esmeralda', 'green', 'emerald'] },
  { label: 'Azul marinho', hue: 220, keywords: ['azul', 'marinho', 'navy', 'blue'] },
  { label: 'Vermelho rubi', hue: 0, keywords: ['vermelho', 'rubi', 'red', 'ruby'] },
  { label: 'Roxo ametista', hue: 282, keywords: ['roxo', 'violeta', 'ametista', 'purple', 'violet'] },
  { label: 'Dourado', hue: 47, keywords: ['dourado', 'ouro', 'gold', 'golden'] }
];

const resolveHueFromPrompt = (prompt: string) => {
  const normalizedPrompt = prompt.toLowerCase();
  return promptHuePresets.find((item) => item.keywords.some((keyword) => normalizedPrompt.includes(keyword)));
};

const App: React.FC = () => {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [sceneMetrics, setSceneMetrics] = useState<SceneMetrics | null>(null);
  const [triggerCapture, setTriggerCapture] = useState(0);
  const [isPickingColor, setIsPickingColor] = useState(false);
  const [config, setConfig] = useState<ProcessingConfig>(DEFAULT_CONFIG);
  const [fps, setFps] = useState(0);
  const [spellPrompt, setSpellPrompt] = useState('');
  const [panelMode, setPanelMode] = useState<'oracle' | 'alchemy'>('oracle');
  const [announcement, setAnnouncement] = useState('Aplicacao inicializada.');

  const advice = useMemo(() => (sceneMetrics ? getSceneAdvice(sceneMetrics) : null), [sceneMetrics]);
  const quality = useMemo(() => computeQualityScore(fps, config.targetFps, sceneMetrics), [fps, config.targetFps, sceneMetrics]);
  const hasBackground = Boolean(backgroundImage);

  const handleCaptureBackground = useCallback(() => {
    setTriggerCapture((prev) => prev + 1);
    setIsPickingColor(false);
    setAnnouncement('Captura de fundo iniciada.');
  }, []);

  const handleBackgroundCaptured = useCallback((dataUrl: string, metrics: SceneMetrics) => {
    setBackgroundImage(dataUrl);
    setSceneMetrics(metrics);
    setAnnouncement('Ambiente calibrado com sucesso.');
  }, []);

  const handleColorPicked = useCallback((hue: number) => {
    setConfig((prev) => ({ ...prev, targetHue: hue }));
    setIsPickingColor(false);
    setAnnouncement('Cor alvo atualizada pela camera.');
  }, []);

  const handlePromptSpell = useCallback(() => {
    const prompt = spellPrompt.trim();
    if (!prompt) {
      setAnnouncement('Descreva uma cor para invocar o efeito.');
      return;
    }

    const matchedPreset = resolveHueFromPrompt(prompt);
    if (matchedPreset) {
      setConfig((prev) => ({ ...prev, targetHue: matchedPreset.hue }));
      setIsPickingColor(false);
      setAnnouncement(`Oraculo ajustou para ${matchedPreset.label}.`);
      return;
    }

    if (panelMode === 'oracle' && advice) {
      setConfig((prev) => ({ ...prev, targetHue: advice.recommendedHue }));
      setIsPickingColor(false);
      setAnnouncement(`Oraculo aplicou a recomendacao ${advice.recommendedName}.`);
      return;
    }

    setAnnouncement('Nao encontrei essa cor. Tente por exemplo: capa verde esmeralda.');
  }, [advice, panelMode, spellPrompt]);

  const handleActivateEffect = useCallback(() => {
    if (!hasBackground) {
      handleCaptureBackground();
      return;
    }

    if (panelMode === 'oracle' && advice) {
      setConfig((prev) => ({ ...prev, targetHue: advice.recommendedHue }));
      setAnnouncement(`Efeito ativado com ${advice.recommendedName}.`);
      return;
    }

    setIsPickingColor(true);
    setAnnouncement('Clique no video para capturar a cor do tecido.');
  }, [advice, handleCaptureBackground, hasBackground, panelMode]);

  const handleSwitchMode = useCallback((mode: 'oracle' | 'alchemy') => {
    setPanelMode(mode);
    setIsPickingColor(false);
    setAnnouncement(mode === 'oracle' ? 'Modo Oraculo (IA) selecionado.' : 'Modo Alquimia selecionado.');
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

      if (key === 'p') {
        event.preventDefault();
        setIsPickingColor((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [handleCaptureBackground]);

  return (
    <div className="app">
      <div className="container arcane-container">
        <header className="arcane-header">
          <div className="arcane-title-wrap">
            <h1 className="arcane-title">CAPA DA INVISIBILIDADE</h1>
            <span className="arcane-star" aria-hidden>
              *
            </span>
          </div>
          <p className="arcane-subtitle">Experimente a verdadeira magia da camuflagem optica via algoritmo.</p>
        </header>

        <main className="arcane-workspace">
          <section className="camera-frame" aria-label="Visualizacao principal">
            <CloakCanvas
              config={config}
              onBackgroundCaptured={handleBackgroundCaptured}
              triggerCapture={triggerCapture}
              triggerSnapshot={0}
              triggerUpload={0}
              isPickingColor={isPickingColor}
              onColorPicked={handleColorPicked}
              onSnapshotCaptured={() => undefined}
              onFpsSample={setFps}
            />
          </section>

          <aside className="arcane-panel" aria-label="Painel arcano">
            <div className="panel-top">
              <h2 className="panel-heading">PAINEL ARCANO</h2>
              <div className="calibration-status">
                <span className={`status-indicator ${hasBackground ? 'is-ready' : ''}`} aria-hidden />
                <span>{hasBackground ? 'CALIBRADO' : 'AGUARDANDO'}</span>
              </div>
            </div>

            <div className="panel-divider" />

            <button type="button" className="recalibrate-button" onClick={handleCaptureBackground}>
              RECALIBRAR AMBIENTE
            </button>

            <p className="recalibrate-caption">Voce tera 3 segundos para sair da cena.</p>

            <div className="mode-switch" role="tablist" aria-label="Modo de controle">
              <button
                type="button"
                className={`mode-chip ${panelMode === 'oracle' ? 'is-active' : ''}`}
                aria-selected={panelMode === 'oracle'}
                onClick={() => handleSwitchMode('oracle')}
              >
                Oraculo (IA)
              </button>
              <button
                type="button"
                className={`mode-chip ${panelMode === 'alchemy' ? 'is-active' : ''}`}
                aria-selected={panelMode === 'alchemy'}
                onClick={() => handleSwitchMode('alchemy')}
              >
                Alquimia
              </button>
            </div>

            <div className="spell-input-row">
              <input
                type="text"
                value={spellPrompt}
                onChange={(event) => setSpellPrompt(event.target.value)}
                className="spell-input"
                placeholder="Descreva a cor... Ex: Capa verde esmeralda"
                aria-label="Prompt de cor"
              />
              <button type="button" className="spell-cast-button" onClick={handlePromptSpell} aria-label="Invocar cor">
                *
              </button>
            </div>

            <div className="panel-mini-stats" aria-label="Indicadores atuais">
              <span>Matiz: {Math.round(config.targetHue)} deg</span>
              <span>FPS: {fps}</span>
              <span>Qualidade: {quality.score}</span>
            </div>

            <button type="button" className="activate-button" onClick={handleActivateEffect}>
              {isPickingColor ? 'SELECIONE A COR NO VIDEO' : 'ATIVAR EFEITO'}
            </button>
          </aside>
        </main>

        <footer className="arcane-footer">
          <a
            className="developer-link"
            href="https://www.matheussiqueira.dev/"
            target="_blank"
            rel="noreferrer"
          >
            Desenvolvido por Matheus Siqueira
          </a>
          <a
            className="whatsapp-button"
            href="https://wa.me/5581999203683"
            target="_blank"
            rel="noreferrer"
            aria-label="Conversar no WhatsApp"
          >
            WhatsApp
          </a>
        </footer>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
};

export default App;
