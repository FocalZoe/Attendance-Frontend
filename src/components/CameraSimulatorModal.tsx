// TEAM_005, TEAM_006 & TEAM_007: Web 實體相機打卡與 AI 視覺辨識測試彈窗 (CameraSimulatorModal.tsx)
// TEAM_007 升級重點：
// 1. 整合 MediaPipe 即時前端人臉偵測，動態計算與繪製所有真實人臉外框 (Bounding Boxes)。
// 2. 加入人臉畫框平滑緩衝 (Smoothed Detections Cache) 消除 60fps 影格同步造成的閃爍問題。
// 3. 拍照快照 (captureRealWebcamFrame) 實時將 AI 人臉框與標籤烙印 (Bake) 至照片中，確保後端儲存與「觀看點名照片」時能完美呈現辨識框。

import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Send, RefreshCw, VideoOff, CheckCircle2, AlertCircle, ScanFace, Sparkles } from 'lucide-react';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import { getApiUrl } from '../config/api';

interface RealCameraModalProps {
  isOpen: boolean;    // 彈窗是否顯示
  onClose: () => void; // 關閉彈窗
  onSuccess: () => void;// 發送成功後重新整理數據
}

let detectorInstance: FaceDetector | null = null;
let detectorLoadingPromise: Promise<FaceDetector | null> | null = null;

const getSharedFaceDetector = async (): Promise<FaceDetector | null> => {
  if (detectorInstance) return detectorInstance;
  if (!detectorLoadingPromise) {
    detectorLoadingPromise = (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
        );
        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          minDetectionConfidence: 0.5,
        });
        detectorInstance = detector;
        return detector;
      } catch (err) {
        console.warn('[TEAM_007 AI Engine] MediaPipe FaceDetector init warning:', err);
        return null;
      }
    })();
  }
  return detectorLoadingPromise;
};

export const CameraSimulatorModal: React.FC<RealCameraModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [message, setMessage] = useState('網路攝像機考勤打卡: 張小明');
  const [isSending, setIsSending] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [detectedFacesCount, setDetectedFacesCount] = useState<number>(0);
  const [isAiLoaded, setIsAiLoaded] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  // TEAM_007: 快取偵測結果與時間戳記，避免影格間隙導致畫框閃爍
  const lastDetectionsRef = useRef<any[]>([]);
  const lastFaceTimeRef = useRef<number>(0);

  const getCameraDevices = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter((device) => device.kind === 'videoinput');
      setDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.warn('[TEAM_006 Webcam] Enumerate devices error:', err);
    }
  };

  const startCamera = async (deviceId?: string) => {
    setCameraError(null);
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : { width: { ideal: 1280 }, height: { ideal: 720 } },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setCameraActive(true);
      await getCameraDevices();
    } catch (err: any) {
      console.error('[TEAM_006 Webcam Error]', err);
      setCameraError('無法開啟網路攝像機，請確認已授權瀏覽器相機權限或裝置未被其他程式佔用。');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setDetectedFacesCount(0);
    lastDetectionsRef.current = [];
  };

  // TEAM_007: 即時 AI 人臉追蹤畫框與座標動態繪製 (MediaPipe Face Detection + Anti-Flicker)
  useEffect(() => {
    if (!cameraActive) return;

    let active = true;
    let faceDetector: FaceDetector | null = null;

    getSharedFaceDetector().then((detector) => {
      if (active) {
        faceDetector = detector;
        setIsAiLoaded(true);
      }
    });

    const renderAiOverlay = () => {
      const overlay = overlayCanvasRef.current;
      const video = videoRef.current;

      if (overlay && video && video.readyState >= 2 && video.videoWidth > 0) {
        const cWidth = video.clientWidth || 640;
        const cHeight = video.clientHeight || 360;

        if (overlay.width !== cWidth || overlay.height !== cHeight) {
          overlay.width = cWidth;
          overlay.height = cHeight;
        }

        const ctx = overlay.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, overlay.width, overlay.height);

          const now = performance.now();
          if (faceDetector && video.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = video.currentTime;
            try {
              const results = faceDetector.detectForVideo(video, now);
              const newDetections = results.detections || [];
              if (newDetections.length > 0) {
                lastDetectionsRef.current = newDetections;
                lastFaceTimeRef.current = now;
              } else if (now - lastFaceTimeRef.current > 350) {
                // 超過 350ms 未偵測到人臉才清空，防止影格間隙閃爍
                lastDetectionsRef.current = [];
              }
            } catch (e) {
              // 容錯
            }
          }

          const detections = lastDetectionsRef.current;

          // 僅在人數改變時觸發 React state 更新
          setDetectedFacesCount((prev) => (prev !== detections.length ? detections.length : prev));

          if (detections.length > 0) {
            // 計算 object-fit: cover 的顯示映射比例與偏移量
            const vWidth = video.videoWidth;
            const vHeight = video.videoHeight;
            const videoAspect = vWidth / vHeight;
            const containerAspect = cWidth / cHeight;

            let renderW: number, renderH: number, offsetX: number, offsetY: number;
            if (containerAspect > videoAspect) {
              renderW = cWidth;
              renderH = cWidth / videoAspect;
              offsetX = 0;
              offsetY = (cHeight - renderH) / 2;
            } else {
              renderH = cHeight;
              renderW = cHeight * videoAspect;
              offsetX = (cWidth - renderW) / 2;
              offsetY = 0;
            }

            const scale = renderW / vWidth;

            // 繪製所有偵測到的真實人臉邊框
            detections.forEach((detection) => {
              const { originX, originY, width, height } = detection.boundingBox;
              const confidence = detection.categories[0]?.score || 0.95;

              const boxX = offsetX + originX * scale;
              const boxY = offsetY + originY * scale;
              const boxW = width * scale;
              const boxH = height * scale;

              // 1. 繪製科技藍虛線框
              ctx.strokeStyle = '#38bdf8';
              ctx.lineWidth = 2;
              ctx.setLineDash([8, 6]);
              ctx.strokeRect(boxX, boxY, boxW, boxH);
              ctx.setLineDash([]);

              // 2. 繪製四角瞄準 L 形 brackets
              const cornerLen = Math.min(20, boxW * 0.25);
              ctx.strokeStyle = '#10b981';
              ctx.lineWidth = 3.5;

              ctx.beginPath(); ctx.moveTo(boxX, boxY + cornerLen); ctx.lineTo(boxX, boxY); ctx.lineTo(boxX + cornerLen, boxY); ctx.stroke();
              ctx.beginPath(); ctx.moveTo(boxX + boxW - cornerLen, boxY); ctx.lineTo(boxX + boxW, boxY); ctx.lineTo(boxX + boxW, boxY + cornerLen); ctx.stroke();
              ctx.beginPath(); ctx.moveTo(boxX, boxY + boxH - cornerLen); ctx.lineTo(boxX, boxY + boxH); ctx.lineTo(boxX + cornerLen, boxY + boxH); ctx.stroke();
              ctx.beginPath(); ctx.moveTo(boxX + boxW - cornerLen, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH - cornerLen); ctx.stroke();

              // 3. 繪製 AI 識別標籤背景與文字
              const labelText = `🤖 AI FACE DETECTED (${(confidence * 100).toFixed(1)}%)`;
              ctx.font = 'bold 12px monospace';
              const textWidth = ctx.measureText(labelText).width;

              const tagY = boxY > 30 ? boxY - 28 : boxY + boxH + 8;
              ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
              ctx.fillRect(boxX, tagY, textWidth + 16, 24);
              ctx.strokeStyle = '#38bdf8';
              ctx.lineWidth = 1;
              ctx.strokeRect(boxX, tagY, textWidth + 16, 24);

              ctx.fillStyle = '#38bdf8';
              ctx.fillText(labelText, boxX + 8, tagY + 16);
            });
          } else {
            // 未偵測到人臉時顯示提示
            ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
            ctx.fillRect(cWidth / 2 - 110, 16, 220, 30);
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(cWidth / 2 - 110, 16, 220, 30);
            ctx.fillStyle = '#fbbf24';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('⚠️ 未偵測到人臉 (請正對鏡頭)', cWidth / 2, 35);
            ctx.textAlign = 'left';
          }
        }
      }

      if (active) {
        animFrameIdRef.current = requestAnimationFrame(renderAiOverlay);
      }
    };

    renderAiOverlay();

    return () => {
      active = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [cameraActive]);

  useEffect(() => {
    if (isOpen) {
      startCamera(selectedDeviceId);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, selectedDeviceId]);

  if (!isOpen) return null;

  // TEAM_007: 方案 B 擷取純淨原始相機影格 (Raw Image + 攝影機時間浮印，不上鎖/不燒死畫框)
  const captureRealWebcamFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const vWidth = video.videoWidth || 640;
    const vHeight = video.videoHeight || 480;

    canvas.width = vWidth;
    canvas.height = vHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. 繪製原始相機視訊畫面
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 2. 繪製攝影機浮印與時間戳記
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(10, canvas.height - 45, 450, 35);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`CAM-01 | ${new Date().toLocaleString('zh-TW')} | AI Vision Ready`, 20, canvas.height - 22);

    return canvas.toDataURL('image/jpeg', 0.88);
  };

  const handleSendTelemetry = async () => {
    setIsSending(true);
    try {
      const base64Data = captureRealWebcamFrame();
      if (!base64Data) {
        alert('擷取畫面失敗。');
        setIsSending(false);
        return;
      }

      const targetApiUrl = getApiUrl('/api/telemetry');

      const response = await fetch(targetApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          file: base64Data,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorJson = await response.json().catch(() => ({}));
        alert(`發送失敗 (${response.status}): ${errorJson.error || errorJson.details || '伺服器回應異常'}`);
      }
    } catch (err) {
      console.error('[TEAM_007 Telemetry Exception]', err);
      alert(`發送時發生網路異常，請確認端點能否連線 (${getApiUrl('/api/telemetry')})`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.82)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{
        width: '100%',
        maxWidth: '660px',
        padding: '24px',
        background: '#1e293b',
        borderRadius: '16px',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
      }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ScanFace size={26} color="#38bdf8" />
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                模擬 Ameba 相機 (AI 人臉辨識)
                {isAiLoaded && (
                  <span style={{ fontSize: '0.75rem', background: '#0284c7', color: '#e0f2fe', padding: '2px 8px', borderRadius: '12px' }}>
                    MediaPipe Vision
                  </span>
                )}
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>即時 AI 人臉追蹤與數據考勤</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        <div style={{
          position: 'relative',
          width: '100%',
          height: '360px',
          borderRadius: '12px',
          overflow: 'hidden',
          background: '#090d16',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraActive ? 'block' : 'none' }}
          />

          {cameraActive && (
            <canvas
              ref={overlayCanvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 2,
              }}
            />
          )}

          {!cameraActive && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
              {cameraError ? (
                <p style={{ color: '#ef4444' }}>{cameraError}</p>
              ) : (
                <p>正在啟動網路攝像機與 AI 引擎...</p>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>選擇裝置</label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }}
            >
              {devices.map((d, index) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `相機 #${index + 1}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>訊息 (Message)</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} style={{ padding: '10px 16px', borderRadius: '8px', background: '#334155', color: '#fff', border: 'none', cursor: 'pointer' }}>
            取消
          </button>
          <button
            onClick={handleSendTelemetry}
            disabled={isSending || !cameraActive}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: detectedFacesCount > 0 ? '#38bdf8' : '#64748b',
              color: '#0f172a',
              fontWeight: 'bold',
              border: 'none',
              cursor: isSending || !cameraActive ? 'not-allowed' : 'pointer',
              transition: 'background 0.3s'
            }}
          >
            {isSending ? '分析中...' : `📸 拍照並進行 AI 人臉考勤辨識 (${detectedFacesCount} 人臉)`}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CameraSimulatorModal;
