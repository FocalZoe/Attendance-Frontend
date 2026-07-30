// TEAM_005: 即時監控儀表板元件 (Dashboard.tsx)
// 【非程式人員導覽】：這個檔案是第一個分頁「即時儀表板」的畫面主體。
// 它就像是辦公室或管理員室的巨型電視螢幕監控牆，包含：
// 1. 今日打卡總數卡片、最新刷卡時間卡片。
// 2. 巨幅顯示最新一張拍攝到的考勤高畫質照片與打卡訊息。
// 3. 近 5 筆打卡動態的快速檢視清單。

import React from 'react';
import { AttendanceRecord } from '../types/attendance';
import { Clock, CheckCircle2, AlertCircle, Eye } from 'lucide-react';

interface DashboardProps {
  latestRecord: AttendanceRecord | null;         // 最新一筆打卡紀錄
  historyRecords: AttendanceRecord[];             // 全部紀錄
  onOpenImageModal: (url: string) => void;        // 開啟照片大圖的函式
}

export const Dashboard: React.FC<DashboardProps> = ({
  latestRecord,
  historyRecords,
  onOpenImageModal,
}) => {
  // 計算今天的打卡筆數
  const todayCount = historyRecords.filter((r) => {
    const recordDate = new Date(r.create_at).toDateString();
    const todayDate = new Date().toDateString();
    return recordDate === todayDate;
  }).length;

  // 格式化最新時間
  const formattedLatestTime = latestRecord
    ? new Date(latestRecord.create_at).toLocaleString('zh-TW', {
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '無紀錄';

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 頂部數據統計卡片網格 (2 欄) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        
        {/* 卡片 1：今日通報總數 */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircle2 size={24} color="var(--color-success)" />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>當日考勤通報總數</span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '4px' }}>{todayCount} <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>次</span></h2>
          </div>
        </div>

        {/* 卡片 2：最新刷卡時間 */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Clock size={24} color="var(--color-primary)" />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>最後通報時間</span>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginTop: '6px' }}>{formattedLatestTime}</h2>
          </div>
        </div>

      </div>

      {/* 主監控區域：左側最新照片大圖看板，右側最近 5 筆刷卡動態 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* 左側：最新刷卡即時看板 */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              📸 最新捕捉考勤影像與訊息
            </h3>
            {latestRecord && (
              <span className="badge badge-success">
                最新廣播事件
              </span>
            )}
          </div>

          {latestRecord ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 大圖容器 */}
              <div
                onClick={() => onOpenImageModal(latestRecord.file_url)}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '420px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: '#090d16',
                  cursor: 'pointer',
                  border: '1px solid var(--border-card)',
                }}
              >
                <img
                  src={latestRecord.file_url}
                  alt={latestRecord.message}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {/* 懸浮點擊放大提示 */}
                <div style={{
                  position: 'absolute', top: '12px', right: '12px',
                  background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '20px',
                  display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#ffffff',
                }}>
                  <Eye size={14} /> 點擊檢視高畫質大圖
                </div>
              </div>

              {/* 考勤詳細資訊標籤 */}
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--border-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                    {latestRecord.message}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    UUID: {latestRecord.id}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>通報時間</span>
                  <p style={{ fontSize: '0.95rem', fontWeight: 500, marginTop: '2px' }}>
                    {new Date(latestRecord.create_at).toLocaleTimeString('zh-TW')}
                  </p>
                </div>
              </div>

            </div>
          ) : (
            <div style={{
              height: '350px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-dim)',
              gap: '12px',
            }}>
              <AlertCircle size={48} opacity={0.5} />
              <p>目前尚無考勤通報紀錄，請透過模擬相機進行打卡。</p>
            </div>
          )}
        </div>

        {/* 右側：最近 5 筆打卡即時動態清單 */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>⚡ 最近刷卡動態 (Top 5)</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '480px' }}>
            {historyRecords.slice(0, 5).map((rec) => (
              <div
                key={rec.id}
                onClick={() => onOpenImageModal(rec.file_url)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
              >
                <img
                  src={rec.file_url}
                  alt={rec.message}
                  style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {rec.message}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {new Date(rec.create_at).toLocaleTimeString('zh-TW')}
                  </span>
                </div>
              </div>
            ))}

            {historyRecords.length === 0 && (
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
                等待通報中...
              </p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
