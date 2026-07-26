// TEAM_001: Navbar 導覽列與即時狀態指示元件
import React from 'react';
import { Camera, LayoutDashboard, History, Activity, Radio } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'history';
  setActiveTab: (tab: 'dashboard' | 'history') => void;
  isConnected: boolean;
  onOpenSimulator: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isConnected,
  onOpenSimulator,
}) => {
  return (
    <header className="glass-panel" style={{ margin: '16px 24px 0 24px', padding: '14px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>

        {/* LOGO 與標題 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)'
          }}>
            <Camera size={24} color="#ffffff" />
          </div>
          <div>
            <h1 className="title-gradient" style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
              Ameba 智慧考勤與即時監控
            </h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Real-time Ameba Camera Stream & Supabase Storage System
            </span>
          </div>
        </div>

        {/* 分頁 Tab */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '12px' }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}
            style={{ borderRadius: '8px', padding: '8px 16px', fontSize: '0.9rem' }}
          >
            <LayoutDashboard size={18} />
            即時儀表板
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}
            style={{ borderRadius: '8px', padding: '8px 16px', fontSize: '0.9rem' }}
          >
            <History size={18} />
            歷史紀錄
          </button>
        </nav>

        {/* 連線狀態與模擬器按鈕 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.04)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className={`pulse-indicator ${isConnected ? 'online' : ''}`} />
            <span style={{ fontSize: '0.85rem', color: isConnected ? 'var(--color-success)' : 'var(--text-muted)', fontWeight: 500 }}>
              {isConnected ? 'WebSocket 已連線' : '嘗試連線中...'}
            </span>
          </div>

          <button onClick={onOpenSimulator} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <Radio size={16} color="var(--color-primary)" />
            模擬 Ameba 傳遞資料 (Webcam)
          </button>
        </div>

      </div>
    </header>
  );
};
