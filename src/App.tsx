// TEAM_001: React 前端主應用程式 App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { AttendanceRecord } from './types/attendance';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { HistoryList } from './components/HistoryList';
import { CameraSimulatorModal } from './components/CameraSimulatorModal';
import { X, Maximize2 } from 'lucide-react';
import { getApiUrl, getWsUrl } from './config/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');
  const [isConnected, setIsConnected] = useState(false);
  const [latestRecord, setLatestRecord] = useState<AttendanceRecord | null>(null);
  const [historyRecords, setHistoryRecords] = useState<AttendanceRecord[]>([]);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  // 抓取 Supabase 歷史數據
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/api/history'));
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.records)) {
          setHistoryRecords(data.records);
          if (data.records.length > 0 && !latestRecord) {
            setLatestRecord(data.records[0]);
          }
        }
      }
    } catch (err) {
      console.error('[TEAM_001 App] Fetch history error:', err);
    }
  }, [latestRecord]);

  // 初始化載入資料與 WebSocket 連線
  useEffect(() => {
    fetchHistory();

    const wsUrl = getWsUrl();

    let socket: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;

    const connectWS = () => {
      try {
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          console.log('[TEAM_001 WS Client] 已成功連接至後端 WebSocket');
          setIsConnected(true);
        };

        socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'NEW_ATTENDANCE_RECORD' && payload.data) {
              const newRec: AttendanceRecord = payload.data;
              setLatestRecord(newRec);
              setHistoryRecords((prev) => [newRec, ...prev]);
            }
          } catch (e) {
            console.error('[TEAM_001 WS Message Parse Error]', e);
          }
        };

        socket.onclose = () => {
          setIsConnected(false);
          // 自動重連
          reconnectTimer = setTimeout(connectWS, 3000);
        };

        socket.onerror = (err) => {
          console.warn('[TEAM_001 WS Error]', err);
          socket?.close();
        };
      } catch (e) {
        console.error('[TEAM_001 WS Connection Exception]', e);
      }
    };

    connectWS();

    return () => {
      if (socket) socket.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 頂部導覽列 */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={isConnected}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
      />

      {/* 主要視圖內容 */}
      <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
        {activeTab === 'dashboard' ? (
          <Dashboard
            latestRecord={latestRecord}
            historyRecords={historyRecords}
            onOpenImageModal={(url) => setSelectedImageUrl(url)}
          />
        ) : (
          <HistoryList
            records={historyRecords}
            onRefresh={fetchHistory}
            onOpenImageModal={(url) => setSelectedImageUrl(url)}
          />
        )}
      </main>

      {/* Ameba 相機測試彈窗 */}
      <CameraSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onSuccess={fetchHistory}
      />

      {/* 圖片大圖檢視 Modal Lightbox */}
      {selectedImageUrl && (
        <div
          onClick={() => setSelectedImageUrl(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <button
              onClick={() => setSelectedImageUrl(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(0,0,0,0.6)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>
            <img src={selectedImageUrl} alt="Full View" style={{ display: 'block', maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain' }} />
          </div>
        </div>
      )}

      {/* 頁尾 Footer */}
      <footer style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
        Ameba Camera Attendance System &copy; 2026. Built with React + Vite + TypeScript + Supabase Storage & Database.
      </footer>

    </div>
  );
};

export default App;
