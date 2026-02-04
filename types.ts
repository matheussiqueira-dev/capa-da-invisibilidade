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
}
