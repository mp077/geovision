/**
 * GeoVision AI — Live Scanner Page
 *
 * Feature 2: Real camera-based rock detection.
 *
 * Pipeline:
 *   Camera frame → canvas capture → base64 JPEG → POST /api/v1/scanner/detect
 *   → backend runs OpenCV contour segmentation + classification → returns bounding boxes
 *   → this component draws boxes on a canvas overlay with class labels
 *
 * No detections are simulated. If the backend is offline or the model isn't
 * ready, a clear status is shown and detection is disabled.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  CameraOff,
  Crosshair,
  AlertCircle,
  RotateCw,
  Trash2,
  Send,
  WifiOff,
  Activity,
  Loader2,
} from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { useSpecimens } from '../context/SpecimenContext';

type ScannerStatus = 'idle' | 'detecting' | 'error' | 'model_unavailable';

interface DetectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class_name: string;
  label: string;
}

interface DetectResponse {
  status: string;
  method?: string;
  boxes: DetectionBox[];
  latency_ms?: number;
  frame_width?: number;
  frame_height?: number;
  error?: string;
}

const DETECTION_INTERVAL_MS = 400; // send a frame every 400ms
const BOX_COLOR = '#5EEAD4';
const BOX_LABEL_BG = 'rgba(43, 87, 66, 0.85)';
const JPEG_QUALITY = 0.72;

export const LiveScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    videoRef,
    status: cameraStatus,
    errorMessage,
    startCamera,
    stopCamera,
    captureFrame,
    facingMode,
    toggleFacingMode,
    hasMultipleCameras,
  } = useCamera();

  const {
    capturedFrames,
    addCapturedFrame,
    removeCapturedFrame,
    clearCapturedFrames,
    setSelectedBufferImage,
    addToast,
    backendUrl,
  } = useSpecimens();

  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const detectionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [scannerStatus, setScannerStatus] = useState<ScannerStatus>('idle');
  const [lastBoxes, setLastBoxes] = useState<DetectionBox[]>([]);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [detectionMethod, setDetectionMethod] = useState<string>('—');
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showReticle, setShowReticle] = useState(true);
  const [detectionActive, setDetectionActive] = useState(false);

  // Check backend health on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${backendUrl}/health`, { signal: AbortSignal.timeout(3000) });
        setBackendOnline(res.ok);
      } catch {
        setBackendOnline(false);
      }
    })();
  }, [backendUrl]);

  // Draw boxes on overlay canvas whenever lastBoxes changes
  const drawBoxes = useCallback((boxes: DetectionBox[]) => {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (boxes.length === 0) return;

    // Scale from video native resolution to displayed size
    const scaleX = canvas.width / (video.videoWidth || canvas.width);
    const scaleY = canvas.height / (video.videoHeight || canvas.height);

    boxes.forEach((box) => {
      const x = box.x * scaleX;
      const y = box.y * scaleY;
      const w = box.width * scaleX;
      const h = box.height * scaleY;

      // Box
      ctx.strokeStyle = BOX_COLOR;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      // Corner brackets
      const cs = 12;
      ctx.strokeStyle = BOX_COLOR;
      ctx.lineWidth = 3;
      [[x, y, cs, 0, 0, cs], [x + w, y, -cs, 0, 0, cs],
       [x, y + h, cs, 0, 0, -cs], [x + w, y + h, -cs, 0, 0, -cs]].forEach(
        ([bx, by, dx1, , , dy2]) => {
          ctx.beginPath();
          ctx.moveTo(bx + dx1, by);
          ctx.lineTo(bx, by);
          ctx.lineTo(bx, by + dy2);
          ctx.stroke();
        }
      );

      // Label background
      const label = box.label || `${box.class_name} ${Math.round(box.confidence * 100)}%`;
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      const textW = ctx.measureText(label).width;
      const labelH = 18;
      const labelY = y - labelH - 2 < 0 ? y + 2 : y - labelH - 2;
      ctx.fillStyle = BOX_LABEL_BG;
      ctx.fillRect(x, labelY, textW + 10, labelH);

      // Label text
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(label, x + 5, labelY + 13);
    });
  }, [videoRef]);

  useEffect(() => {
    drawBoxes(lastBoxes);
  }, [lastBoxes, drawBoxes]);

  // Detection loop
  const runDetection = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);

    try {
      setScannerStatus('detecting');
      const res = await fetch(`${backendUrl}/scanner/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frame: dataUrl }),
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 503) {
          setScannerStatus('model_unavailable');
          stopDetection();
        } else {
          setScannerStatus('error');
        }
        console.error('Detection error:', err);
        return;
      }

      const data: DetectResponse = await res.json();
      setLatencyMs(data.latency_ms ?? null);
      setDetectionMethod(data.method || 'contour_segmentation');
      setLastBoxes(data.boxes || []);
      setScannerStatus(data.boxes.length > 0 ? 'detecting' : 'idle');
    } catch {
      setScannerStatus('error');
      setLastBoxes([]);
    }
  }, [backendUrl, videoRef]);

  const startDetection = useCallback(() => {
    if (detectionTimerRef.current) clearInterval(detectionTimerRef.current);
    setDetectionActive(true);
    runDetection();
    detectionTimerRef.current = setInterval(runDetection, DETECTION_INTERVAL_MS);
  }, [runDetection]);

  const stopDetection = useCallback(() => {
    if (detectionTimerRef.current) {
      clearInterval(detectionTimerRef.current);
      detectionTimerRef.current = null;
    }
    setDetectionActive(false);
    setLastBoxes([]);
    setScannerStatus('idle');
    const canvas = overlayCanvasRef.current;
    if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Stop detection when camera stops
  useEffect(() => {
    if (cameraStatus !== 'active') {
      stopDetection();
    }
  }, [cameraStatus, stopDetection]);

  // Cleanup on unmount
  useEffect(() => () => stopDetection(), [stopDetection]);

  const handleCapture = () => {
    const frameData = captureFrame();
    if (frameData) {
      addCapturedFrame(frameData);
    } else {
      addToast('Capture Failed', 'Camera stream not ready.', 'warning');
    }
  };

  const handleSaveCapture = async (dataUrl: string) => {
    try {
      const res = await fetch(`${backendUrl}/scanner/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frame: dataUrl, notes: '' }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Saved to History', `Scan ${data.id} saved.`, 'success');
      } else {
        addToast('Save Failed', data.detail || 'Server error', 'error');
      }
    } catch {
      addToast('Save Failed', 'Backend unreachable.', 'error');
    }
  };

  const handleSendToIdentify = (dataUrl: string) => {
    setSelectedBufferImage(dataUrl);
    navigate('/identify');
  };

  const statusDot = {
    idle: 'bg-[#8C959F]',
    detecting: 'bg-[#22C55E] animate-pulse',
    error: 'bg-red-500',
    model_unavailable: 'bg-[#D97706]',
  }[scannerStatus];

  const statusLabel = {
    idle: 'Idle',
    detecting: 'Detecting',
    error: 'Error',
    model_unavailable: 'Model N/A',
  }[scannerStatus];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E5E2DA]">
        <h2 className="font-serif-title text-xl font-semibold text-[#1C2127]">Live Scanner</h2>
        <div className="flex items-center gap-2">
          {cameraStatus === 'active' ? (
            <>
              {hasMultipleCameras && (
                <button onClick={toggleFacingMode} className="px-2.5 py-1.5 bg-white hover:bg-[#F4F2EB] text-[#1C2127] border border-[#DDD8CD] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
                  <RotateCw className="w-3.5 h-3.5 text-[#57606A]" /><span>Flip</span>
                </button>
              )}
              {detectionActive ? (
                <button onClick={stopDetection} className="px-3 py-1.5 bg-[#FEF7EE] hover:bg-[#FDE8C5] text-[#9A5B13] border border-[#F8DFC0] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
                  <Activity className="w-3.5 h-3.5" /><span>Stop Detection</span>
                </button>
              ) : (
                <button
                  onClick={backendOnline === false ? undefined : startDetection}
                  disabled={backendOnline === false}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                    backendOnline === false
                      ? 'bg-[#E5E2DA] text-[#8C959F] border-[#DDD8CD] cursor-not-allowed'
                      : 'bg-[#EBF3EE] hover:bg-[#D4EAE0] text-[#2B5742] border-[#CCE2D5]'
                  }`}
                  title={backendOnline === false ? 'Backend offline' : 'Start AI detection'}
                >
                  <Activity className="w-3.5 h-3.5" /><span>Start Detection</span>
                </button>
              )}
              <button onClick={stopCamera} className="px-3 py-1.5 bg-[#FBF1F1] hover:bg-[#F6E1E1] text-[#9C382C] border border-[#F8D2CE] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
                <CameraOff className="w-3.5 h-3.5" /><span>Stop</span>
              </button>
              <button onClick={handleCapture} className="px-3.5 py-1.5 bg-[#2B5742] hover:bg-[#224635] text-white rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-xs">
                <Camera className="w-3.5 h-3.5" /><span>Capture</span>
              </button>
            </>
          ) : (
            <button onClick={startCamera} className="px-3.5 py-2 bg-[#2B5742] hover:bg-[#224635] text-white rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-xs">
              <Camera className="w-4 h-4" /><span>Start Camera</span>
            </button>
          )}
        </div>
      </div>

      {/* Backend offline warning */}
      {backendOnline === false && (
        <div className="p-3 bg-[#FBF1F1] border border-[#F6C2BE] rounded-xl text-xs text-[#9C382C] flex items-center gap-2">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span>Backend offline — detection disabled. Start the server: <code className="font-mono-data bg-[#F6E1E1] px-1 rounded">python -m uvicorn backend.app.main:app --port 8000</code></span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Camera Viewport */}
        <div className="lg:col-span-8 space-y-3">
          <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-xl overflow-hidden bg-[#121316] border border-[#2A2E35] flex items-center justify-center shadow-md">
            {/* Video element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-contain ${cameraStatus === 'active' ? 'block' : 'hidden'}`}
            />

            {/* Detection overlay canvas */}
            {cameraStatus === 'active' && (
              <canvas
                ref={overlayCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
            )}

            {/* Camera idle/error states */}
            {cameraStatus !== 'active' && (
              <div className="text-center p-6 max-w-sm text-white/90">
                {cameraStatus === 'idle' && (
                  <>
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                      <Camera className="w-6 h-6 stroke-[1.5]" />
                    </div>
                    <div className="font-semibold text-sm text-white mb-4">Camera Inactive</div>
                    <button onClick={startCamera} className="mt-2 px-4 py-2 bg-[#2B5742] hover:bg-[#34674E] text-white rounded-lg text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm">
                      <Camera className="w-4 h-4" /><span>Start Camera</span>
                    </button>
                  </>
                )}
                {cameraStatus === 'requesting' && (
                  <div className="space-y-2">
                    <Loader2 className="w-8 h-8 text-white/60 animate-spin mx-auto" />
                    <div className="text-xs font-medium text-white">Requesting permission…</div>
                  </div>
                )}
                {cameraStatus === 'permission-denied' && (
                  <div className="space-y-2 text-xs">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
                    <div className="font-semibold text-white">Camera Permission Denied</div>
                    <p className="text-[11px] text-[#9DA7B3]">Enable camera access in your browser address bar.</p>
                  </div>
                )}
                {cameraStatus === 'unavailable' && (
                  <div className="space-y-1.5 text-xs">
                    <div className="font-semibold text-white">No Camera Found</div>
                    <p className="text-[11px] text-[#9DA7B3]">Connect a webcam and try again.</p>
                  </div>
                )}
                {cameraStatus === 'error' && (
                  <div className="space-y-1 text-red-400 text-xs">
                    <AlertCircle className="w-6 h-6 mx-auto" />
                    <div>{errorMessage}</div>
                  </div>
                )}
              </div>
            )}

            {/* HUD overlay */}
            {cameraStatus === 'active' && (
              <div className="absolute inset-0 pointer-events-none select-none">
                {showGrid && (
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 border border-white/10">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="border border-white/[0.07]" />
                    ))}
                  </div>
                )}
                {showReticle && !detectionActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 sm:w-60 sm:h-60 border border-dashed border-[#5EEAD4]/60 rounded-lg relative">
                      <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#5EEAD4]" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#5EEAD4]" />
                      <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#5EEAD4]" />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#5EEAD4]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Crosshair className="w-5 h-5 text-[#5EEAD4]/40" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Detection status chip */}
                <div className="absolute top-3 left-3 bg-[#1C2127]/85 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded text-xs font-mono-data text-white flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                  <span>Detection: {statusLabel}</span>
                  {latencyMs !== null && <span className="text-[#8C959F] ml-1">{latencyMs.toFixed(0)}ms</span>}
                </div>

                {/* Capture button */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-auto">
                  <button onClick={handleCapture} className="px-4 py-2 bg-white text-[#1C2127] rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95">
                    <Camera className="w-3.5 h-3.5 text-[#2B5742]" /><span>Capture Frame</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Controls bar */}
          {cameraStatus === 'active' && (
            <div className="flex items-center justify-between p-2.5 bg-white border border-[#E5E2DA] rounded-lg text-xs text-[#57606A]">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="accent-[#2B5742]" />
                  <span>Grid</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={showReticle} onChange={(e) => setShowReticle(e.target.checked)} className="accent-[#2B5742]" />
                  <span>Reticle</span>
                </label>
              </div>
              <span className="font-mono-data text-[11px] text-[#8C959F]">{facingMode}</span>
            </div>
          )}
        </div>

        {/* Status Card */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-[#E5E2DA] rounded-xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2EFE9]">
              <h3 className="font-serif-title text-sm font-semibold text-[#1C2127]">Scanner Status</h3>
              <span className={`text-[10px] font-mono-data uppercase px-1.5 py-0.5 rounded border font-semibold ${
                backendOnline
                  ? detectionActive
                    ? 'bg-[#EBF3EE] text-[#2B5742] border-[#CCE2D5]'
                    : 'bg-[#F2F9F4] text-[#57606A] border-[#D0E8D8]'
                  : 'bg-[#FEF7EE] text-[#9A5B13] border-[#F8DFC0]'
              }`}>
                {backendOnline === null ? 'Checking…' : backendOnline ? (detectionActive ? 'Active' : 'Online') : 'Offline'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2 bg-[#FAF9F6] rounded-lg border border-[#EDE7DE] flex justify-between">
                <span className="text-[#8C959F]">Backend:</span>
                <span className={`font-mono-data ${backendOnline ? 'text-[#2B5742]' : 'text-[#9C382C]'}`}>
                  {backendOnline === null ? '…' : backendOnline ? 'Connected' : 'Offline'}
                </span>
              </div>
              <div className="p-2 bg-[#FAF9F6] rounded-lg border border-[#EDE7DE] flex justify-between">
                <span className="text-[#8C959F]">Method:</span>
                <span className="font-mono-data text-[#1C2127] truncate max-w-[140px]">{detectionMethod}</span>
              </div>
              <div className="p-2 bg-[#FAF9F6] rounded-lg border border-[#EDE7DE] flex justify-between">
                <span className="text-[#8C959F]">Latency:</span>
                <span className="font-mono-data text-[#1C2127]">{latencyMs !== null ? `${latencyMs.toFixed(0)} ms` : '— ms'}</span>
              </div>
              <div className="p-2 bg-[#FAF9F6] rounded-lg border border-[#EDE7DE] flex justify-between">
                <span className="text-[#8C959F]">Detections:</span>
                <span className="font-mono-data text-[#1C2127]">{lastBoxes.length}</span>
              </div>
              <div className="p-2 bg-[#FAF9F6] rounded-lg border border-[#EDE7DE] flex justify-between">
                <span className="text-[#8C959F]">Stream:</span>
                <span className="font-mono-data text-[#1C2127]">{cameraStatus === 'active' ? 'Active' : 'Standby'}</span>
              </div>
            </div>

            {/* Live detections list */}
            {lastBoxes.length > 0 && (
              <div className="pt-2 border-t border-[#F2EFE9]">
                <div className="text-[10px] font-mono-data uppercase text-[#8C959F] mb-1.5">Detected Specimens</div>
                <div className="space-y-1">
                  {lastBoxes.map((box, i) => (
                    <div key={i} className="flex items-center justify-between p-1.5 bg-[#EBF3EE] rounded-lg text-[11px]">
                      <span className="font-semibold text-[#1C2127] truncate">{box.class_name || 'Rock specimen'}</span>
                      <span className="font-mono-data text-[#2B5742] font-bold ml-2">{Math.round(box.confidence * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detection explanation */}
            <div className="pt-2 border-t border-[#F2EFE9]">
              <p className="text-[10px] text-[#8C959F] leading-relaxed">
                {detectionActive
                  ? 'Sending frames to backend every 400ms. Detection uses OpenCV contour segmentation + MobileNetV2 classification.'
                  : 'Click "Start Detection" to begin sending frames to the backend for AI-powered rock localization.'}
              </p>
              {scannerStatus === 'model_unavailable' && (
                <p className="text-[10px] text-[#9A5B13] mt-1 font-mono-data">
                  ⚠ Classifier model not trained. Train it first to get class labels.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Captured Frames */}
      <div className="bg-white border border-[#E5E2DA] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#F2EFE9]">
          <div className="flex items-center gap-2">
            <h3 className="font-serif-title text-sm font-semibold text-[#1C2127]">Captured Frames</h3>
            <span className="text-xs font-mono-data px-1.5 py-0.5 rounded bg-[#F2EFE9] text-[#57606A]">{capturedFrames.length}</span>
          </div>
          {capturedFrames.length > 0 && (
            <button onClick={clearCapturedFrames} className="text-xs text-[#9C382C] hover:underline flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {capturedFrames.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#8C959F]">
            No frames captured. Click <strong>Capture Frame</strong> during camera stream.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
            {capturedFrames.map((frame, index) => (
              <div key={frame.id} className="group relative rounded-lg overflow-hidden border border-[#E5E2DA] bg-[#FAF9F6] hover:border-[#2B5742] transition-colors">
                <img src={frame.dataUrl} alt={`Frame ${index + 1}`} className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1.5">
                  <button
                    onClick={() => handleSendToIdentify(frame.dataUrl)}
                    className="w-full py-1 px-1.5 bg-[#2B5742] text-white text-[10px] font-semibold rounded flex items-center justify-center gap-1 hover:bg-[#34674E]"
                  >
                    <Send className="w-3 h-3" /> Identify
                  </button>
                  <button
                    onClick={() => handleSaveCapture(frame.dataUrl)}
                    className="w-full py-1 px-1.5 bg-white/20 text-white text-[10px] font-semibold rounded flex items-center justify-center gap-1 hover:bg-white/30"
                  >
                    Save to History
                  </button>
                  <button onClick={() => removeCapturedFrame(frame.id)} className="p-1 text-white/80 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
