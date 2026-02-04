import type { SceneAdvice, SceneMetrics } from '../types';

const hueToName = (hue: number) => {
  const h = (hue + 360) % 360;
  if (h < 15 || h >= 345) return 'vermelho';
  if (h < 45) return 'laranja';
  if (h < 70) return 'amarelo';
  if (h < 150) return 'verde';
  if (h < 200) return 'ciano';
  if (h < 260) return 'azul';
  if (h < 300) return 'indigo';
  return 'magenta';
};

export const getSceneAdvice = (metrics: SceneMetrics): SceneAdvice => {
  const lightingLabel = metrics.avgBrightness < 35 ? 'Baixa' : metrics.avgBrightness < 70 ? 'Equilibrada' : 'Forte';
  const textureLabel = metrics.textureScore < 30 ? 'Limpa' : metrics.textureScore < 60 ? 'Texturizada' : 'Movimentada';
  const recommendedHue = (metrics.dominantHue + 180) % 360;
  const recommendedName = hueToName(recommendedHue);

  const tips: string[] = [];

  if (metrics.avgBrightness < 35) {
    tips.push('Aumente a iluminacao para melhorar o recorte.');
  }

  if (metrics.avgBrightness > 80) {
    tips.push('Evite luz direta no tecido para reduzir reflexos.');
  }

  if (metrics.textureScore > 60) {
    tips.push('Fundo uniforme gera um efeito mais limpo.');
  }

  if (metrics.avgSaturation < 20) {
    tips.push('Escolha um tecido com cor bem saturada.');
  }

  tips.push(`Para maior contraste, experimente ${recommendedName}.`);

  const summary = `Luz ${lightingLabel.toLowerCase()} e fundo ${textureLabel.toLowerCase()}.`;

  return {
    summary,
    lightingLabel,
    textureLabel,
    recommendedHue,
    recommendedName,
    tips
  };
};
