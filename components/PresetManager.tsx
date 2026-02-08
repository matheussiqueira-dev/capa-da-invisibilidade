import React, { useState } from 'react';
import type { CalibrationPreset } from '../types';

interface PresetManagerProps {
  presets: CalibrationPreset[];
  activePresetId: string | null;
  onSavePreset: (name: string) => void;
  onApplyPreset: (id: string) => void;
  onDeletePreset: (id: string) => void;
}

const formatDate = (value: string) => new Date(value).toLocaleString();

const PresetManager: React.FC<PresetManagerProps> = ({
  presets,
  activePresetId,
  onSavePreset,
  onApplyPreset,
  onDeletePreset
}) => {
  const [name, setName] = useState('');

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSavePreset(trimmed);
    setName('');
  };

  return (
    <section className="panel" aria-labelledby="preset-title">
      <div>
        <h3 id="preset-title" className="panel-title">
          Presets de Calibracao
        </h3>
        <p className="panel-subtitle">Salve configuracoes para diferentes ambientes de luz.</p>
      </div>

      <div className="preset-form">
        <input
          className="text-input"
          type="text"
          maxLength={40}
          placeholder="Ex.: Quarto com luz fria"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-label="Nome do preset"
        />
        <button type="button" className="button button--secondary" onClick={handleSave}>
          Salvar preset
        </button>
      </div>

      <div className="history-list">
        {presets.length === 0 ? (
          <p className="panel-subtitle">Nenhum preset salvo.</p>
        ) : (
          presets.map((preset) => (
            <div key={preset.id} className="history-item">
              <div>
                <div className="metric-value">{preset.name}</div>
                <div className="status-caption">{formatDate(preset.createdAt)}</div>
              </div>
              <div className="inline-row">
                <button
                  type="button"
                  className={`button button--secondary button--tiny ${activePresetId === preset.id ? 'is-active' : ''}`}
                  onClick={() => onApplyPreset(preset.id)}
                >
                  Aplicar
                </button>
                <button
                  type="button"
                  className="button button--danger button--tiny"
                  onClick={() => onDeletePreset(preset.id)}
                >
                  Remover
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default PresetManager;
