// TEAM_001: Dashboard 即時儀表板與視覺化圖表元件
import React, { useMemo } from 'react';
import { AttendanceRecord } from '../types/attendance';
import { Camera, Clock, Activity, HardDrive, Maximize2, ShieldCheck, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';

interface DashboardProps {
  latestRecord: AttendanceRecord | null;
  historyRecords: AttendanceRecord[];
  onOpenImageModal: (url: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  latestRecord,
  historyRecords,
  onOpenImageModal,
}) => {
  // 統計數據：計算近幾小時事件頻率
  const hourlyData = useMemo(() => {
    const hoursMap: Record<string, number> = {};
    const now = new Date();
    
    // 初始化過去 8 小時
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600 * 1000);
      const label = `${d.getHours().toString().padStart(2, '0')}:00`;
      hoursMap[label] = 0;
    }

    historyRecords.forEach((rec) => {
      if (!rec.create_at) return;
      const d = new Date(rec.create_at);
      const label = `${d.getHours().toString().padStart(2, '0')}:00`;
      if (hoursMap[label] !== undefined) {
        hoursMap[label] += 1;
      }
    });

    return Object.keys(hoursMap).map((time) => ({
      time,
      count: hoursMap[time],
    }));
  }, [historyRecords]);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 頂部指標卡片區 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--color-primary)' }}>
            <Activity size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>今日總傳輸紀錄</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ffffff' }}>{historyRecords.length} 筆</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--color-accent)' }}>
            <Clock size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>最近收檔時間</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff' }}>
              {latestRecord?.create_at ? new Date(latestRecord.create_at).toLocaleTimeString('zh-TW') : '無資料'}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(52, 211, 153, 0.15)', color: 'var(--color-success)' }}>
            <HardDrive size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Supabase Storage</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-success)' }}>attendance-images</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(251, 191, 36, 0.15)', color: 'var(--color-warning)' }}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>辨識狀態</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff' }}>即時自動寫入</div>
          </div>
        </div>

      </div>

      {/* 主要展演區：最新即時畫面 + 數據圖表 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        
        {/* 左側：即時圖片與訊息展示 */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Camera size={20} color="var(--color-primary)" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Ameba 攝像機即時接收</h2>
            </div>
            <span style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.2)', color: 'var(--color-primary)' }}>
              LIVE STREAM
            </span>
          </div>

          {/* 圖片展示窗 */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '320px',
            borderRadius: '14px',
            overflow: 'hidden',
            background: '#090d16',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {latestRecord?.file_url ? (
              <>
                <img
                  src={latestRecord.file_url}
                  alt="Ameba Stream"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
                <button
                  onClick={() => onOpenImageModal(latestRecord.file_url)}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    color: '#ffffff',
                  }}
                  title="放大圖片"
                >
                  <Maximize2 size={18} />
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
                <Camera size={48} style={{ opacity: 0.4, marginBottom: '12px' }} />
                <p>等待 Ameba / 攝像機發送 JSON 數據...</p>
              </div>
            )}
          </div>

          {/* 訊息面板 */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>最新文字訊息 (Message)</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-primary)' }}>
              {latestRecord?.message || '尚無即時通報訊息'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Timestamp: {latestRecord?.create_at ? new Date(latestRecord.create_at).toLocaleString('zh-TW') : 'N/A'}
            </div>
          </div>
        </div>

        {/* 右側：事件趨勢圖表 */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>考勤與事件頻率趨勢 (Hourly)</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>近 8 小時統計</span>
          </div>

          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  labelStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="count" name="事件筆數" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 最新 3 筆歷史快速列表 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>最新 3 筆打卡通報</div>
            {historyRecords.slice(0, 3).map((rec) => (
              <div key={rec.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={rec.file_url} alt="thumb" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>{rec.message}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{new Date(rec.create_at).toLocaleTimeString('zh-TW')}</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', background: 'rgba(56,189,248,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                  Saved
                </span>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
};
