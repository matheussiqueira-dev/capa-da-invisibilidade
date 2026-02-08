import { rgbToHslInto } from './colorUtils';
import type { SceneMetrics } from '../types';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const analyzeImageData = (imageData: ImageData): SceneMetrics => {
  const { data, width, height } = imageData;
  const step = Math.max(4, Math.floor(Math.min(width, height) / 80));
  const hueBins = new Array(12).fill(0);
  const hueBinSize = 360 / hueBins.length;
  const hsl = { h: 0, s: 0, l: 0 };

  let count = 0;
  let sumL = 0;
  let sumS = 0;
  let sumL2 = 0;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      rgbToHslInto(r, g, b, hsl);

      sumL += hsl.l;
      sumS += hsl.s;
      sumL2 += hsl.l * hsl.l;
      count += 1;

      if (hsl.s > 10 && hsl.l > 10 && hsl.l < 95) {
        const bin = Math.floor(hsl.h / hueBinSize) % hueBins.length;
        hueBins[bin] += 1;
      }
    }
  }

  const safeCount = Math.max(count, 1);
  const avgBrightness = sumL / safeCount;
  const avgSaturation = sumS / safeCount;
  const variance = sumL2 / safeCount - avgBrightness * avgBrightness;
  const textureScore = clamp(Math.sqrt(Math.max(variance, 0)) * 1.5, 0, 100);

  let dominantHue = 0;
  let maxBin = 0;
  hueBins.forEach((value, index) => {
    if (value > maxBin) {
      maxBin = value;
      dominantHue = index * hueBinSize + hueBinSize / 2;
    }
  });

  return {
    avgBrightness: Math.round(avgBrightness * 10) / 10,
    avgSaturation: Math.round(avgSaturation * 10) / 10,
    dominantHue: Math.round(dominantHue),
    textureScore: Math.round(textureScore)
  };
};
