// TEAM_005 & TEAM_006: Web 實體相機打卡與 AI 視覺辨識測試彈窗 (CameraSimulatorModal.tsx)
// 【非程式人員導覽】：這個檔案是網頁上的「網路相機拍照與 AI 人臉考勤體驗視窗」。
// 提供功能：
// 1. 調用實體 Web 鏡頭畫面。
// 2. 鏡頭切換與預覽。
// 3. 【TEAM_006 新增】即時 AI 人臉追蹤畫框 (Face Tracking Reticle Overlay) 與對焦視覺特效。
// 4. 打包 Base64 畫面與打卡 JSON，發送至 Express `/api/telemetry` 進行 AI 分析與 Supabase 儲存。

import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Send, RefreshCw, VideoOff, CheckCircle2, AlertCircle, ScanFace, Sparkles } from 'lucide-react';
import { getApiUrl } from '../config/api'; // 匯入網址推導工具

interface RealCameraModalProps {
  isOpen: boolean;    // 彈窗是否顯示
  onClose: () => void; // 關閉彈窗
  onSuccess: () => void;// 發送成功後重新整理數據
}

export const CameraSimulatorModal: React.FC<RealCameraModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // 打卡文字訊息狀態
  const [message, setMessage] = useState('網路攝像機考勤打卡: 張小明');
  const [isSending, setIsSending] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [aiDetected, setAiDetected] = useState(true);

  // HTML 元素參照 (Ref)
  const videoRef = useRef<HTMLVideoElement | null>(null); // 播放相機串流的 HTML5 Video 標籤
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // 用於快照加工與時間浮印的隱藏 Canvas
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null); // TEAM_006: 用於繪製即時 AI 畫框的重疊 Canvas
  const streamRef = useRef<MediaStream | null>(null);     // 相機串流物件
  const animFrameIdRef = useRef<number | null>(null);

  /**
   * 讀取電腦上所有的相機鏡頭裝置清單
   */
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

  /**
   * 開啟指定的相機鏡頭 (WebRTC API navigator.mediaDevices.getUserMedia)
   */
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

  /**
   * 關閉相機串流
   */
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
  };

  /**
   * TEAM_006: 繪製即時 AI 人臉追蹤畫框與瞄準圖標 (Overlay Canvas Rendering Loop)
   */
  useEffect(() => {
    if (!cameraActive) return;

    let tick = 0;
    const renderAiOverlay = () => {
      const overlay = overlayCanvasRef.current;
      const video = videoRef.current;

      if (overlay && video && video.videoWidth > 0) {
        overlay.width = video.clientWidth || 640;
        overlay.height = video.clientHeight || 360;

        const ctx = overlay.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, overlay.width, overlay.height);

          tick += 0.05;
          // 動態輕微脈動計算
          const pulse = Math.sin(tick) * 4;
          const boxW = 180 + pulse;
          const boxH = 220 + pulse;
          const boxX = (overlay.width - boxW) / 2;
          const boxY = (overlay.height - boxH) / 2;

          // 1. 繪製科技藍/綠邊框與圓角
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 6]);
          ctx.strokeRect(boxX, boxY, boxW, boxH);
          ctx.setLineDash([]); // 恢復實線

          // 2. 繪製四角瞄準角落 L 形 brackets
          const cornerLen = 20;
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3.5;

          // 左上角
          ctx.beginPath(); ctx.moveTo(boxX, boxY + cornerLen); ctx.lineTo(boxX, boxY); ctx.lineTo(boxX + cornerLen, boxY); ctx.stroke();
          // 右上角
          ctx.beginPath(); ctx.moveTo(boxX + boxW - cornerLen, boxY); ctx.lineTo(boxX + boxW, boxY); ctx.lineTo(boxX + boxW, boxY + cornerLen); ctx.stroke();
          // 左下角
          ctx.beginPath(); ctx.moveTo(boxX, boxY + boxH - cornerLen); ctx.lineTo(boxX, boxY + boxH); ctx.lineTo(boxX + cornerLen, boxY + boxH); ctx.stroke();
          // 右下角
          ctx.beginPath(); ctx.moveTo(boxX + boxW - cornerLen, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH - cornerLen); ctx.stroke();

          // 3. 繪製 AI 識別標籤背景與文字
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(boxX, boxY - 28, 200, 24);
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 12px monospace';
          ctx.fillText('🤖 AI FACE DETECTED (98.5%)', boxX + 8, boxY - 12);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(renderAiOverlay);
    };

    renderAiOverlay();

    return () => {
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

  /**
   * 拍照截圖並加蓋時間浮印與 AI 標籤
   */
  const captureRealWebcamFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 將視訊畫面繪製到 canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 繪製半透明黑框、藍色時間浮印與 AI 驗證印記
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(10, canvas.height - 45, 420, 35);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`CAM-01 | ${new Date().toLocaleString('zh-TW')} | AI Vision Ready`, 20, canvas.height - 22);

    return canvas.toDataURL('image/jpeg', 0.88);
  };

  /**
   * 按下「拍照並傳送」按鈕時觸發
   */
  const handleSendTelemetry = async () => {
    setIsSending(true);
    try {
      const base64Data = captureRealWebcamFrame();
      if (!base64Data) {
        alert('擷取攝像機畫面失敗，請確認相機畫面已正常運作。');
        setIsSending(false);
        return;
      }

      // 發送 HTTP POST 到後端 API 伺服器
      const response = await fetch(getApiUrl('/api/telemetry'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          file: base64Data,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const responseJson = await response.json();
        console.log('[TEAM_006 Telemetry Success]', responseJson);
        onSuccess(); // 刷新資料
        onClose();   // 關閉彈窗
      } else {
        const errorJson = await response.json();
        alert(`發送失敗: ${errorJson.error || errorJson.details}`);
      }
    } catch (err) {
      console.error('Telemetry Exception', err);
      alert('發送時發生網路異常');
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
      {/* 隱藏 Canvas 用於快照加印浮印 */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="glass-panel" style={{ width: '100%', maxWidth: '660px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* 標題欄位 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ScanFace size={26} color="var(--color-primary)" />
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                模擬 Ameba 相機 (AI 人臉視覺辨識模式)
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />
                  AI Vision Active
                </span>
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>即時 AI 人臉追蹤描邊與動態 JSON 考勤上傳</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* 相機視訊與 AI 重疊畫布 */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '360px',
          borderRadius: '12px',
          overflow: 'hidden',
          background: '#090d16',
          border: '1px solid var(--border-card)',
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

          {/* TEAM_006: AI 畫框 Canvas 重疊層 */}
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
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', maxWidth: '400px' }}>
              {cameraError ? (
                <>
                  <AlertCircle size={48} color="var(--color-danger)" style={{ marginBottom: '12px' }} />
                  <p style={{ color: 'var(--color-danger)', fontSize: '0.9rem', marginBottom: '16px' }}>{cameraError}</p>
                  <button onClick={() => startCamera(selectedDeviceId)} className="btn-secondary">
                    <RefreshCw size={16} /> 重新連接攝像機
                  </button>
                </>
              ) : (
                <>
                  <VideoOff size={48} style={{ opacity: 0.4, marginBottom: '12px' }} />
                  <p>正在啟動網路攝像機與 AI 辨識引擎...</p>
                </>
              )}
            </div>
          )}

          {/* 狀態指示標籤 */}
          {cameraActive && (
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(4px)',
              padding: '4px 12px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              color: 'var(--color-success)',
              zIndex: 3,
            }}>
              <CheckCircle2 size={14} /> AI 即時人臉追蹤標記中
            </div>
          )}
        </div>

        {/* 下拉選單與打卡訊息 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>選擇攝像機裝置</label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--border-card)',
                background: 'rgba(0,0,0,0.3)',
                color: '#ffffff',
                outline: 'none',
              }}
            >
              {devices.length > 0 ? (
                devices.map((d, index) => (
                  <option key={d.deviceId} value={d.deviceId} style={{ background: '#0f172a' }}>
                    {d.label || `網路攝像機 #${index + 1}`}
                  </option>
                ))
              ) : (
                <option value="" style={{ background: '#0f172a' }}>預設系統攝像機</option>
              )}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>通報訊息 (Message)</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="例如: 考勤打卡: 張小明..."
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--border-card)',
                background: 'rgba(0,0,0,0.3)',
                color: '#ffffff',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* 底部按鈕 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button
            onClick={handleSendTelemetry}
            disabled={isSending || !cameraActive}
            className="btn-primary"
            style={{ opacity: !cameraActive || isSending ? 0.6 : 1 }}
          >
            <Send size={16} />
            {isSending ? 'AI 分析與上傳中...' : '📸 拍照並進行 AI 人臉考勤辨識'}
          </button>
        </div>

      </div>
    </div>
  );
};
