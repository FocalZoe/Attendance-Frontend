// TEAM_005: 頂部導覽列元件 (Navbar.tsx)
// 【非程式人員導覽】：這個檔案是網頁頂部的「選單與狀態列」。
// 它固定出現在畫面最頂端，提供：
// 1. 系統 Logo 與名稱標籤。
// 2. 分頁切換按鈕（「即時儀表板」與「歷史紀錄簿」）。
// 3. 即時對講機連線燈標（顯示綠燈「即時連線中」或灰燈「連線中斷」）。
// 4. 開啟相機打卡測試彈窗的按鈕。

import React from 'react';
import { Camera, LayoutDashboard, History, Wifi, WifiOff } from 'lucide-react'; // 匯入好看的圖示包

interface NavbarProps {
  activeTab: 'dashboard' | 'history';                  // 目前在看哪個分頁
  setActiveTab: (tab: 'dashboard' | 'history') => void;// 切換分頁的命令
  isConnected: boolean;                                // 對講機是否連線中
  onOpenSimulator: () => void;                         // 開啟相機測試彈窗的動作
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isConnected,
  onOpenSimulator,
}) => {
  return (
    <header style={{
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-card)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0 24px',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* 左側：品牌 Logo 與系統名稱 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--color-primary), #0284c7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
          }}>
            <Camera size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.5px' }}>
              Zoe Attendance
            </h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Ameba 相機即時考勤系統
            </span>
          </div>
        </div>

        {/* 中間：分頁切換按鈕組 (即時儀表板 vs 歷史紀錄簿) */}
        <div style={{
          display: 'flex',
          background: 'rgba(0,0,0,0.3)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-card)',
        }}>
          {/* 分頁 1：即時儀表板 */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={activeTab === 'dashboard' ? 'nav-tab active' : 'nav-tab'}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'dashboard' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'dashboard' ? '#000000' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            <LayoutDashboard size={16} /> 即時儀表板
          </button>

          {/* 分頁 2：歷史紀錄簿 */}
          <button
            onClick={() => setActiveTab('history')}
            className={activeTab === 'history' ? 'nav-tab active' : 'nav-tab'}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'history' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'history' ? '#000000' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            <History size={16} /> 歷史紀錄簿
          </button>
        </div>

        {/* 右側：WebSocket 連線狀態燈號標籤 + 相機測試按鈕 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          
          {/* 即時連線狀態燈標 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.85rem',
            padding: '6px 12px',
            borderRadius: '20px',
            background: isConnected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: isConnected ? 'var(--color-success)' : 'var(--color-danger)',
            border: `1px solid ${isConnected ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          }}>
            {isConnected ? (
              <>
                <Wifi size={14} /> 即時連線中
              </>
            ) : (
              <>
                <WifiOff size={14} /> 連線中斷
              </>
            )}
          </div>

          {/* 相機打卡測試彈窗觸發按鈕 */}
          <button
            onClick={onOpenSimulator}
            className="btn-primary"
            style={{
              padding: '8px 16px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Camera size={16} /> 模擬相機打卡
          </button>

        </div>
      </div>
    </header>
  );
};
