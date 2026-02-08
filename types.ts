export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

export interface SceneMetrics {
  avgBrightness: number;
  avgSaturation: number;
  dominantHue: number;
  textureScore: number;
}

export interface SessionQuality {
  score: number;
  label: 'Excelente' | 'Boa' | 'Regular' | 'Critica';
}

export interface SceneAdvice {
  summary: string;
  lightingLabel: string;
  textureLabel: string;
  recommendedHue: number;
  recommendedName: string;
  tips: string[];
}

export interface ProcessingConfig {
  targetHue: number;
  hueThreshold: number;
  satThreshold: number;
  valThreshold: number;
  edgeSoftness: number;
  targetFps: number;
}

export interface CalibrationPreset {
  id: string;
  name: string;
  createdAt: string;
  config: ProcessingConfig;
}

export interface TimelineSample {
  createdAt: string;
  fps: number;
  qualityScore: number | null;
}
