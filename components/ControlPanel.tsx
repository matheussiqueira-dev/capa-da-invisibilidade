import React from 'react';
import { ProcessingConfig } from '../types';
import { hexToRgb, rgbToHsl, hslToHex } from '../utils/colorUtils';

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

  const handlePreset = (hue: number) => {
    handleChange('targetHue', hue);
  };

  return (
    <div className="panel">
      <div>
        <h3 className="panel-title">Painel de Controle</h3>
        <p className="panel-subtitle">Ajuste fino do recorte e acoes rapidas da sessao.</p>
      </div>

      <div className="button-row">
        <button type="button" className="button button--primary" onClick={onCaptureBackground}>
          {hasBackground ? 'Regravar fundo' : 'Capturar fundo'}
        </button>
        <button type="button" className="button button--secondary" onClick={onSnapshot}>
          Salvar snapshot
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
          Resetar cena
        </button>
      </div>

      <div className="control-group">
        <label className="control-label">
          Cor alvo
          <span>{Math.round(config.targetHue)} deg</span>
        </label>
        <input
          type="color"
          value={hslToHex(config.targetHue, 100, 50)}
          onChange={handleColorChange}
          className="color-picker"
          aria-label="Selecionar cor alvo"
        />
        <div className="preset-row">
          {colorPresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="preset-chip"
              onClick={() => handlePreset(preset.hue)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <p className="control-hint">Use o seletor ou clique na tela para capturar a cor do tecido.</p>
      </div>

      <div className="control-group">
        <label className="control-label">
          Tolerancia de matiz
          <span>±{config.hueThreshold}</span>
        </label>
        <input
          type="range"
          min="5"
          max="90"
          value={config.hueThreshold}
          onChange={(e) => handleChange('hueThreshold', Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <label className="control-label">
          Saturacao minima
          <span>{config.satThreshold}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={config.satThreshold}
          onChange={(e) => handleChange('satThreshold', Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <label className="control-label">
          Brilho minimo
          <span>{config.valThreshold}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={config.valThreshold}
          onChange={(e) => handleChange('valThreshold', Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <label className="control-label">
          Suavizacao de borda
          <span>{config.edgeSoftness}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={config.edgeSoftness}
          onChange={(e) => handleChange('edgeSoftness', Number(e.target.value))}
        />
        <p className="control-hint">Valores maiores deixam a transicao mais suave.</p>
      </div>
    </div>
  );
};

export default ControlPanel;
