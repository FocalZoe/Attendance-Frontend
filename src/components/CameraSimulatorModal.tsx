// TEAM_005: Web 實體相機打卡與測試彈窗 (CameraSimulatorModal.tsx)
// 【非程式人員導覽】：這個檔案是網頁上的「網路相機拍照體驗視窗」。
// 點擊「模擬相機打卡」按鈕時會彈出此視窗，提供：
// 1. 調用電腦或手機的真實視訊鏡頭 (Webcam)，呈現畫面。
// 2. 下拉選單：切換不同的鏡頭裝置。
// 3. 畫面快照與加印浮印：按下「拍照並傳送」時，會將鏡頭畫面截圖，並在右下角自動加蓋 `CAM-01 | YYYY/MM/DD HH:mm:ss` 藍色時間浮印。
// 4. 打包成 Base64 JSON，發送 HTTP POST 到後端 `/api/telemetry` 完成一次打卡體驗。

import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Send, RefreshCw, VideoOff, CheckCircle2, AlertCircle } from 'lucide-react';
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
  // 打卡文字訊息狀態，預設為 "網路攝像機考勤打卡: 張小明"
  const [message, setMessage] = useState('網路攝像機考勤打卡: 張小明');
  const [isSending, setIsSending] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // HTML 元素參照 (Ref)
  const videoRef = useRef<HTMLVideoElement | null>(null); // 播放相機串流的 HTML5 Video 標籤
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // 用於截圖與繪製時間浮印的隱藏 Canvas 畫布
  const streamRef = useRef<MediaStream | null>(null);     // 相機串流物件

  /**
   * 函式 1：讀取電腦上所有的相機鏡頭裝置清單
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
      console.warn('[TEAM_005 Webcam] Enumerate devices error:', err);
    }
  };

  /**
   * 函式 2：開啟指定的相機鏡頭 (WebRTC API navigator.mediaDevices.getUserMedia)
   */
  const startCamera = async (deviceId?: string) => {
    setCameraError(null);
    stopCamera(); // 先關閉先前的相機串流

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : { width: { ideal: 1280 }, height: { ideal: 720 } },
      };

      // 向瀏覽器要求存取攝影機權限
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // 將串流餵給 Video 標籤播放
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setCameraActive(true);
      await getCameraDevices();
    } catch (err: any) {
      console.error('[TEAM_005 Webcam Error]', err);
      setCameraError('無法開啟網路攝像機，請確認已授權瀏覽器相機權限或裝置未被其他程式佔用。');
      setCameraActive(false);
    }
  };

  /**
   * 函式 3：關閉相機串流
   */
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // 當彈窗開啟或切換鏡頭時，自動啟動/關閉相機
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
   * 函式 4：拍照截圖並加蓋時間浮印
   * 將 Video 目前畫格繪製到 Canvas 上，加上時間與設備代碼浮印，最後轉換成 Base64 JPEG 文字
   */
  const captureRealWebcamFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 把 video 當前畫面畫到 canvas 畫布上
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 繪製半透明黑框與天藍色文字浮印
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, canvas.height - 40, 360, 30);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`CAM-01 | ${new Date().toLocaleString('zh-TW')}`, 20, canvas.height - 20);

    // 轉為 Base64 JPEG 文字碼
    return canvas.toDataURL('image/jpeg', 0.88);
  };

  /**
   * 函式 5：按下「拍照並傳送」按鈕時觸發
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
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      {/* 隱藏的 HTML5 Canvas 用於畫布快照加工 */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* 標題與關閉按鈕 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Camera size={24} color="var(--color-primary)" />
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>模擬 Ameba 傳遞資料 (Webcam 實體相機)</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>擷取相機即時畫面並打包 JSON 上傳至 Supabase</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* 相機即時 Preview 畫面視窗 */}
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

          {/* 相機連線綠燈指示 */}
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

        {/* 裝置選擇下拉選單與打卡訊息輸入框 */}
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
