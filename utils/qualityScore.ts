import type { SceneMetrics, SessionQuality } from '../types';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const computeQualityScore = (
  fps: number,
  targetFps: number,
  sceneMetrics: SceneMetrics | null
): SessionQuality => {
  if (!sceneMetrics) {
    return { score: 0, label: 'Critica' };
  }

  const fpsScore = clamp((fps / Math.max(targetFps, 1)) * 100, 0, 100);
  const brightnessBalance = 100 - Math.abs(sceneMetrics.avgBrightness - 55) * 1.8;
  const saturationScore = clamp(sceneMetrics.avgSaturation * 1.2, 0, 100);
  const textureScore = 100 - clamp(sceneMetrics.textureScore, 0, 100);

  const score = clamp(
    fpsScore * 0.45 +
      clamp(brightnessBalance, 0, 100) * 0.2 +
      saturationScore * 0.2 +
      textureScore * 0.15,
    0,
    100
  );

  const label: SessionQuality['label'] =
    score >= 80 ? 'Excelente' : score >= 62 ? 'Boa' : score >= 42 ? 'Regular' : 'Critica';

  return {
    score: Math.round(score),
    label
  };
};
