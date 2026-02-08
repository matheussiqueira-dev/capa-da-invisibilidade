import React from 'react';
import { ProcessingConfig } from '../types';
import { hexToRgb, hslToHex, rgbToHsl } from '../utils/colorUtils';

interface ControlPanelProps {
  config: ProcessingConfig;
  setConfig: React.Dispatch<React.SetStateAction<ProcessingConfig>>;
  onCaptureBackground: () => void;
  onReset: () => void;
  onSnapshot: () => void;
  hasBackground: boolean;
  isPickingColor: boolean;
  onTogglePickColor: () => void;
}

const colorPresets = [
  { label: 'Vermelho', hue: 0 },
  { label: 'Laranja', hue: 25 },
  { label: 'Amarelo', hue: 55 },
  { label: 'Verde', hue: 120 },
  { label: 'Ciano', hue: 190 },
  { label: 'Azul', hue: 230 },
  { label: 'Magenta', hue: 315 }
];

const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  setConfig,
  onCaptureBackground,
  onReset,
  onSnapshot,
  hasBackground,
  isPickingColor,
  onTogglePickColor
}) => {
  const handleChange = (key: keyof ProcessingConfig, value: number) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    const { r, g, b } = hexToRgb(hex);
    const { h } = rgbToHsl(r, g, b);
    handleChange('targetHue', h);
  };

  return (
    <section className="panel" aria-labelledby="control-panel-title">
      <div>
        <h3 id="control-panel-title" className="panel-title">
          Controle do Efeito
        </h3>
        <p className="panel-subtitle">Calibracao em tempo real para recorte limpo e estavel.</p>
      </div>

      <div className="button-row">
        <button type="button" className="button button--primary" onClick={onCaptureBackground}>
          {hasBackground ? 'Regravar fundo (B)' : 'Capturar fundo (B)'}
        </button>
        <button
          type="button"
          className="button button--secondary"
          onClick={onSnapshot}
          disabled={!hasBackground}
        >
          Salvar snapshot (S)
        </button>
        <button
          type="button"
          className={`button toggle-button ${isPickingColor ? 'is-active' : ''}`}
          onClick={onTogglePickColor}
          aria-pressed={isPickingColor}
        >
          {isPickingColor ? 'Clique na tela' : 'Capturar cor'}
        </button>
        <button type="button" className="button button--danger" onClick={onReset}>
          Resetar sessao
        </button>
      </div>

      <div className="control-group">
        <label className="control-label" htmlFor="target-color-input">
          Cor alvo
          <span>{Math.round(config.targetHue)} deg</span>
        </label>
        <input
          id="target-color-input"
          type="color"
          value={hslToHex(config.targetHue, 100, 50)}
          onChange={handleColorChange}
          className="color-picker"
          aria-label="Selecionar cor alvo"
        />
        <div className="preset-row" role="list" aria-label="Cores predefinidas">
          {colorPresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="preset-chip"
              onClick={() => handleChange('targetHue', preset.hue)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <p className="control-hint">Atalhos: B fundo, S snapshot, U upload para API.</p>
      </div>

      <div className="control-group">
        <label className="control-label" htmlFor="hue-threshold-input">
          Tolerancia de matiz
          <span>+/-{config.hueThreshold}</span>
        </label>
        <input
          id="hue-threshold-input"
          type="range"
          min="5"
          max="90"
          value={config.hueThreshold}
          onChange={(e) => handleChange('hueThreshold', Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <label className="control-label" htmlFor="sat-threshold-input">
          Saturacao minima
          <span>{config.satThreshold}%</span>
        </label>
        <input
          id="sat-threshold-input"
          type="range"
          min="0"
          max="100"
          value={config.satThreshold}
          onChange={(e) => handleChange('satThreshold', Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <label className="control-label" htmlFor="val-threshold-input">
          Brilho minimo
          <span>{config.valThreshold}%</span>
        </label>
        <input
          id="val-threshold-input"
          type="range"
          min="0"
          max="100"
          value={config.valThreshold}
          onChange={(e) => handleChange('valThreshold', Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <label className="control-label" htmlFor="edge-softness-input">
          Suavizacao de borda
          <span>{config.edgeSoftness}%</span>
        </label>
        <input
          id="edge-softness-input"
          type="range"
          min="0"
          max="100"
          value={config.edgeSoftness}
          onChange={(e) => handleChange('edgeSoftness', Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <label className="control-label" htmlFor="target-fps-input">
          FPS alvo
          <span>{config.targetFps}</span>
        </label>
        <input
          id="target-fps-input"
          type="range"
          min="15"
          max="60"
          step="5"
          value={config.targetFps}
          onChange={(e) => handleChange('targetFps', Number(e.target.value))}
        />
        <p className="control-hint">Menos FPS reduz CPU; mais FPS melhora fluidez.</p>
      </div>
    </section>
  );
};

export default ControlPanel;
