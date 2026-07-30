// TEAM_005: React 前端主應用程式 (App.tsx - 前端大腦與狀態總中樞)
// 【非程式人員導覽】：這個檔案是整個前端網頁的「總管理員與司令部」。
// 它掌管了四大任務：
// 1. 頁面切換控制：決定目前畫面要顯示「即時儀表板 (Dashboard)」還是「歷史紀錄簿 (HistoryList)」。
// 2. 開啟對講機 (WebSocket)：網頁一打開就自動連線到後端 WebSocket 廣播塔，聽候新打卡紀錄。
// 3. 數據記憶庫 (State)：儲存最新的考勤紀錄與整份歷史紀錄清單。當 WebSocket 傳來新打卡時，自動更新畫面。
// 4. 全螢幕照片燈箱 (Lightbox)：點擊圖片時彈出高畫質的大圖視窗。

import React, { useState, useEffect, useCallback } from 'react';
import { AttendanceRecord } from './types/attendance'; // 匯入考勤紀錄的資料表單規格
import { Navbar } from './components/Navbar'; // 匯入頂部導覽列
import { Dashboard } from './components/Dashboard'; // 匯入即時儀表板元件
import { HistoryList } from './components/HistoryList'; // 匯入歷史紀錄清單元件
import { CameraSimulatorModal } from './components/CameraSimulatorModal'; // 匯入 Web 相機測試彈窗元件
import { X } from 'lucide-react'; // 匯入關閉按鈕圖示
import { getApiUrl, getWsUrl } from './config/api'; // 匯入 API 與 WebSocket 連線位址自動推導工具

export const App: React.FC = () => {
  // 【狀態 1】：目前選中的選單分頁，預設為 'dashboard' (即時儀表板)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');

  // 【狀態 2】：與後端 WebSocket 即時對講機的連線狀態 (true: 已連線綠燈, false: 斷線灰燈)
  const [isConnected, setIsConnected] = useState(false);

  // 【狀態 3】：最新的一筆考勤紀錄 (顯示在儀表板最上方)
  const [latestRecord, setLatestRecord] = useState<AttendanceRecord | null>(null);

  // 【狀態 4】：完整的考勤紀錄歷史列表
  const [historyRecords, setHistoryRecords] = useState<AttendanceRecord[]>([]);

  // 【狀態 5】：相機測試彈窗是否開啟 (true/false)
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // 【狀態 6】：目前正在放大檢視的圖片網址 (若為 null 代表未點擊大圖)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  /**
   * 函式：透過 HTTP API 向後端抓取歷史考勤紀錄 (GET /api/history)
   */
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/api/history'));
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.records)) {
          setHistoryRecords(data.records); // 更新歷史清單
          // 若有紀錄且目前還沒有最新紀錄，把第一筆設為最新紀錄
          if (data.records.length > 0 && !latestRecord) {
            setLatestRecord(data.records[0]);
          }
        }
      }
    } catch (err) {
      console.error('[TEAM_005 App] Fetch history error:', err);
    }
  }, [latestRecord]);

  /**
   * 初始化與生命週期 (useEffect)：
   * 當使用者開啟網頁時：
   * 1. 立即呼叫 fetchHistory() 載入目前的歷史紀錄。
   * 2. 自動連線後端 WebSocket，持續監聽有沒有新相機打卡。
   */
  useEffect(() => {
    fetchHistory(); // 載入初始紀錄

    const wsUrl = getWsUrl(); // 取得連線網址 (如 ws://localhost:5000)

    let socket: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;

    // 建立與維持 WebSocket 連線的內部函式
    const connectWS = () => {
      try {
        socket = new WebSocket(wsUrl);

        // 當連線成功時觸發
        socket.onopen = () => {
          console.log('[TEAM_005 WS Client] 已成功連接至後端 WebSocket 廣播塔');
          setIsConnected(true); // 亮起連線成功綠燈
        };

        // 當收到後端廣播的對講機訊息時觸發！
        socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            // 檢查是否是「新考勤紀錄」廣播事件
            if (payload.type === 'NEW_ATTENDANCE_RECORD' && payload.data) {
              const newRec: AttendanceRecord = payload.data;
              console.log('[TEAM_005 WS Client] 收到即時打卡推播！', newRec);
              
              setLatestRecord(newRec); // 將這筆資料設為最新紀錄
              setHistoryRecords((prev) => [newRec, ...prev]); // 把新紀錄插入到列表的最頂端
            }
          } catch (e) {
            console.error('[TEAM_005 WS Message Parse Error]', e);
          }
        };

        // 當 WebSocket 斷開連線時觸發
        socket.onclose = () => {
          setIsConnected(false); // 變更為離線灰燈
          // 啟動 3 秒後自動重連機制
          reconnectTimer = setTimeout(connectWS, 3000);
        };

        // 當連線出錯時觸發
        socket.onerror = (err) => {
          console.warn('[TEAM_005 WS Error]', err);
          socket?.close();
        };
      } catch (e) {
        console.error('[TEAM_005 WS Connection Exception]', e);
      }
    };

    connectWS(); // 開始建立 WebSocket 連線

    // 當頁面關閉或卸載時，自動清理與關閉連線，防止記憶體洩漏
    return () => {
      if (socket) socket.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. 頂部導覽列：負責切換分頁與顯示連線燈標 */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={isConnected}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
      />

      {/* 2. 主要畫面區域：依據 activeTab 選中的分頁切換顯示內容 */}
      <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
        {activeTab === 'dashboard' ? (
          // 即時儀表板：顯示最新照片、即時數據與最近動態
          <Dashboard
            latestRecord={latestRecord}
            historyRecords={historyRecords}
            onOpenImageModal={(url) => setSelectedImageUrl(url)}
          />
        ) : (
          // 歷史紀錄簿：顯示完整列表、關鍵字搜尋與重新整理按鈕
          <HistoryList
            records={historyRecords}
            onRefresh={fetchHistory}
            onOpenImageModal={(url) => setSelectedImageUrl(url)}
          />
        )}
      </main>

      {/* 3. Web 相機打卡測試彈窗 (Modal) */}
      <CameraSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onSuccess={fetchHistory}
      />

      {/* 4. 全螢幕照片大圖燈箱 (Lightbox Modal)：當點擊任何考勤照片時開啟 */}
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
            {/* 關閉按鈕 */}
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
            {/* 照片大圖 */}
            <img src={selectedImageUrl} alt="Full View" style={{ display: 'block', maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain' }} />
          </div>
        </div>
      )}

      {/* 5. 頁尾 Footer */}
      <footer style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
        Ameba Camera Attendance System &copy; 2026. Built with React + Vite + TypeScript + Supabase Storage & Database.
      </footer>

    </div>
  );
};

export default App;
