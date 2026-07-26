// TEAM_001: 真實網路攝像機 (Real Webcam) 拍照與 Ameba JSON 發送彈窗
import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Send, RefreshCw, VideoOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { getApiUrl } from '../config/api';

interface RealCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

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

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 取得攝像機裝置清單
  const getCameraDevices = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter((device) => device.kind === 'videoinput');
      setDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.warn('[TEAM_001 Webcam] Enumerate devices error:', err);
    }
  };

  // 啟動實體網路攝像機
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
      console.error('[TEAM_001 Webcam Error]', err);
      setCameraError('無法開啟網路攝像機，請確認已授權瀏覽器相機權限或裝置未被其他程式佔用。');
      setCameraActive(false);
    }
  };

  // 關閉攝像機
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

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

  // 從實體攝像機擷取真實畫面並轉為 Base64 JPEG
  const captureRealWebcamFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 將 video 當前畫面繪製至 canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 加上簡單的時間浮印
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, canvas.height - 40, 360, 30);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`CAM-01 | ${new Date().toLocaleString('zh-TW')}`, 20, canvas.height - 20);

    // 輸出 Base64 JPEG
    return canvas.toDataURL('image/jpeg', 0.88);
  };

  // 單次發送 Ameba JSON 資料至後端
  const handleSendTelemetry = async () => {
    setIsSending(true);
    try {
      const base64Data = captureRealWebcamFrame();
      if (!base64Data) {
        alert('擷取攝像機畫面失敗，請確認相機畫面已正常運作。');
        setIsSending(false);
        return;
      }

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
        onSuccess();
        onClose();
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
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      {/* 隱藏 Canvas 用於快照 */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* 標題與關閉按鈕 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Camera size={24} color="var(--color-primary)" />
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>模擬 Ameba 傳遞資料 (Webcam)</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>目前使用 Webcam 擷取畫面並打包 JSON 上傳至 Supabase</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* 實體攝像機即時 Preview */}
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
                  <p>正在啟動網路攝像機...</p>
                </>
              )}
            </div>
          )}

          {/* 相機運作指示 */}
          {cameraActive && (
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'rgba(0,0,0,0.6)',
              padding: '4px 12px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              color: 'var(--color-success)',
            }}>
              <CheckCircle2 size={14} /> 相機即時串流中
            </div>
          )}
        </div>

        {/* 裝置選擇與訊息輸入 */}
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
              placeholder="例如: 門禁考勤刷卡成功..."
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
            {isSending ? '上傳 Supabase 中...' : '📸 拍照並傳送 JSON 至 Supabase'}
          </button>
        </div>

      </div>
    </div>
  );
};
