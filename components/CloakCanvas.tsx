import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ProcessingConfig, SceneMetrics } from '../types';
import { rgbToHsl, getMatchStrength } from '../utils/colorUtils';
import { analyzeImageData } from '../utils/sceneAnalysis';

interface CloakCanvasProps {
  config: ProcessingConfig;
  onBackgroundCaptured: (dataUrl: string, metrics: SceneMetrics) => void;
  triggerCapture: number;
  triggerSnapshot: number;
  triggerUpload: number;
  isPickingColor: boolean;
  onColorPicked: (hue: number) => void;
  onSnapshotCaptured: (dataUrl: string) => void;
  onFpsSample: (fps: number) => void;
}

const CloakCanvas: React.FC<CloakCanvasProps> = ({
  config,
  onBackgroundCaptured,
  triggerCapture,
  triggerSnapshot,
  triggerUpload,
  isPickingColor,
  onColorPicked,
  onSnapshotCaptured,
  onFpsSample
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundRef = useRef<ImageData | null>(null);
  const animationFrameRef = useRef<number>();
  const configRef = useRef(config);
  const overlayTimerRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const fpsFrameCountRef = useRef(0);
  const fpsLastTickRef = useRef(0);

  const [errorType, setErrorType] = useState<'PERMISSION_DENIED' | 'UNKNOWN' | null>(null);
  const [overlayMessage, setOverlayMessage] = useState<string | null>(null);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const showOverlay = useCallback((message: string, duration = 1600) => {
    setOverlayMessage(message);
    if (overlayTimerRef.current) {
      window.clearTimeout(overlayTimerRef.current);
    }
    overlayTimerRef.current = window.setTimeout(() => setOverlayMessage(null), duration);
  }, []);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
          };
        }
      } catch (err: any) {
        console.error('Error accessing camera:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorType('PERMISSION_DENIED');
        } else {
          setErrorType('UNKNOWN');
        }
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (overlayTimerRef.current) {
        window.clearTimeout(overlayTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (triggerCapture === 0 || !canvasRef.current || !videoRef.current) {
      return;
    }

    showOverlay('Capturando fundo...');

    const timer = window.setTimeout(() => {
      if (!canvasRef.current || !videoRef.current) return;

      const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const frame = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
      backgroundRef.current = frame;

      const metrics = analyzeImageData(frame);
      onBackgroundCaptured(canvasRef.current.toDataURL('image/png'), metrics);
      showOverlay('Fundo capturado');
    }, 600);

    return () => window.clearTimeout(timer);
  }, [triggerCapture, onBackgroundCaptured, showOverlay]);

  useEffect(() => {
    if (triggerSnapshot === 0 || !canvasRef.current) {
      return;
    }

    const dataUrl = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `cloak-snapshot-${Date.now()}.png`;
    link.click();

    showOverlay('Snapshot salvo');
  }, [triggerSnapshot, showOverlay]);

  useEffect(() => {
    if (triggerUpload === 0 || !canvasRef.current) {
      return;
    }

    const dataUrl = canvasRef.current.toDataURL('image/png');
    onSnapshotCaptured(dataUrl);
    showOverlay('Snapshot capturado');
  }, [triggerUpload, onSnapshotCaptured, showOverlay]);

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isPickingColor || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;

      const rawX = (event.clientX - rect.left) * scaleX;
      const rawY = (event.clientY - rect.top) * scaleY;
      const mirroredX = canvasRef.current.width - rawX;

      const x = Math.min(Math.max(Math.round(mirroredX), 0), canvasRef.current.width - 1);
      const y = Math.min(Math.max(Math.round(rawY), 0), canvasRef.current.height - 1);

      const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const { h } = rgbToHsl(pixel[0], pixel[1], pixel[2]);
      onColorPicked(h);
      showOverlay('Cor capturada');
    },
    [isPickingColor, onColorPicked, showOverlay]
  );

  useEffect(() => {
    const processFrame = (time: number) => {
      if (!canvasRef.current || !videoRef.current || videoRef.current.readyState !== 4) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const targetFps = Math.max(10, configRef.current.targetFps || 30);
      const frameInterval = 1000 / targetFps;

      if (time - lastFrameRef.current < frameInterval) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }
      lastFrameRef.current = time;

      const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const width = canvasRef.current.width;
      const height = canvasRef.current.height;

      ctx.drawImage(videoRef.current, 0, 0, width, height);

      if (!backgroundRef.current) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const frameData = ctx.getImageData(0, 0, width, height);
      const pixelData = frameData.data;
      const bgData = backgroundRef.current.data;

      const { targetHue, hueThreshold, satThreshold, valThreshold, edgeSoftness } = configRef.current;
      const len = pixelData.length;

      for (let i = 0; i < len; i += 4) {
        const r = pixelData[i];
        const g = pixelData[i + 1];
        const b = pixelData[i + 2];

        const { h, s, l } = rgbToHsl(r, g, b);
        const strength = getMatchStrength(
          h,
          s,
          l,
          targetHue,
          hueThreshold,
          satThreshold,
          valThreshold,
          edgeSoftness
        );

        if (strength <= 0) {
          continue;
        }

        const blend = edgeSoftness === 0 ? 1 : strength;
        pixelData[i] = pixelData[i] * (1 - blend) + bgData[i] * blend;
        pixelData[i + 1] = pixelData[i + 1] * (1 - blend) + bgData[i + 1] * blend;
        pixelData[i + 2] = pixelData[i + 2] * (1 - blend) + bgData[i + 2] * blend;
      }

      ctx.putImageData(frameData, 0, 0);

      fpsFrameCountRef.current += 1;
      if (!fpsLastTickRef.current) {
        fpsLastTickRef.current = time;
      }
      const elapsed = time - fpsLastTickRef.current;
      if (elapsed >= 1000) {
        const fps = Math.round((fpsFrameCountRef.current * 1000) / elapsed);
        onFpsSample(fps);
        fpsFrameCountRef.current = 0;
        fpsLastTickRef.current = time;
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <div className={`canvas-shell ${isPickingColor ? 'is-picking' : ''}`}>
      {errorType && (
        <div className="canvas-overlay">
          <div className="overlay-card">
            {errorType === 'PERMISSION_DENIED'
              ? 'Permissao da camera negada. Ative e recarregue a pagina.'
              : 'Nao foi possivel acessar a camera. Verifique se ela esta disponivel.'}
          </div>
        </div>
      )}

      <video ref={videoRef} className="hidden" muted playsInline />

      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        onClick={handleCanvasClick}
        role="img"
        aria-label="Visualizacao ao vivo do manto"
      />

      <div className="canvas-top-left">
        <div
          className="swatch"
          style={{ backgroundColor: `hsl(${config.targetHue}, 100%, 50%)` }}
          aria-hidden
        />
        <span>Cor alvo</span>
      </div>

      {backgroundRef.current && (
        <div className="canvas-top-right">
          <span className="live-dot" />
          <span>AO VIVO</span>
        </div>
      )}

      {overlayMessage && (
        <div className="canvas-overlay">
          <div className="overlay-card">{overlayMessage}</div>
        </div>
      )}

      {!overlayMessage && isPickingColor && !errorType && (
        <div className="canvas-overlay">
          <div className="overlay-card">Clique no tecido para capturar a cor.</div>
        </div>
      )}

      {!backgroundRef.current && !errorType && !overlayMessage && !isPickingColor && (
        <div className="canvas-overlay">
          <div className="overlay-card">Capture o fundo para iniciar o efeito.</div>
        </div>
      )}
    </div>
  );
};

export default CloakCanvas;
