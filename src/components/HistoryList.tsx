// TEAM_005 & TEAM_006: 歷史紀錄簿元件 (HistoryList.tsx)
// 展示考勤歷史紀錄，並針對 TEAM_006 AI 人臉辨識紀錄標註視覺 Badge。

import React, { useState } from 'react';
import { AttendanceRecord } from '../types/attendance';
import { Search, RefreshCw, Eye, Calendar, User, Sparkles, CheckCircle } from 'lucide-react';

interface HistoryListProps {
  records: AttendanceRecord[];                   // 考勤紀錄總清單
  onRefresh: () => void;                          // 手動重新整理的函式
  onOpenImageModal: (record: AttendanceRecord) => void; // 開啟大圖燈箱的函式
}

export const HistoryList: React.FC<HistoryListProps> = ({
  records,
  onRefresh,
  onOpenImageModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecords = records.filter((r) =>
    r.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 頂部操作區：搜尋輸入框 + 手動重新整理按鈕 */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        
        {/* 搜尋輸入框 */}
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="搜尋打卡訊息、人員姓名或關鍵字..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 42px',
              borderRadius: '10px',
              border: '1px solid var(--border-card)',
              background: 'rgba(0, 0, 0, 0.3)',
              color: '#ffffff',
              outline: 'none',
              fontSize: '0.9rem',
            }}
          />
        </div>

        {/* 右側：紀錄筆數統計與手動重新整理按鈕 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            共符合 <strong style={{ color: 'var(--color-primary)' }}>{filteredRecords.length}</strong> 筆紀錄
          </span>
          <button onClick={onRefresh} className="btn-secondary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={16} /> 重新整理
          </button>
        </div>

      </div>

      {/* 紀錄卡片網格 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {filteredRecords.map((rec) => (
          <div
            key={rec.id}
            className="glass-panel"
            style={{
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
          >
            {/* 考勤照片容器 */}
            {(() => {
              let aiAnalysis = rec.ai_analysis;
              if (typeof aiAnalysis === 'string') {
                try {
                  aiAnalysis = JSON.parse(aiAnalysis);
                } catch (e) {}
              }
              const hasFace = Boolean(
                aiAnalysis &&
                (aiAnalysis.detected === true ||
                 (aiAnalysis.faces && aiAnalysis.faces.length > 0) ||
                 (aiAnalysis.face_count && aiAnalysis.face_count > 0))
              );

              return (
                <div
                  onClick={() => onOpenImageModal(rec)}
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '200px',
                    background: '#090d16',
                    cursor: 'pointer',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={rec.file_url}
                    alt={rec.message}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', opacity: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.2s',
                  }}>
                    <Eye size={24} color="#ffffff" />
                  </div>

                  {/* TEAM_007: 僅在有人臉狀態時，預覽圖片右上角顯示 AI 人臉比對 標籤 */}
                  {hasFace && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      backdropFilter: 'blur(4px)',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      color: '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.45)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      zIndex: 2,
                    }}>
                      <Sparkles size={12} /> AI 人臉比對
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 考勤詳細內容區 */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={16} /> {rec.message}
                </h4>

                {/* TEAM_007: AI 信心度標籤 (防爆 JSON 解析與條件隱藏) */}
                {(() => {
                  let aiAnalysis = rec.ai_analysis;
                  if (typeof aiAnalysis === 'string') {
                    try {
                      aiAnalysis = JSON.parse(aiAnalysis);
                    } catch (e) {
                      aiAnalysis = undefined;
                    }
                  }
                  const hasFace = Boolean(
                    aiAnalysis &&
                    (aiAnalysis.detected === true ||
                     (aiAnalysis.faces && aiAnalysis.faces.length > 0) ||
                     (aiAnalysis.face_count && aiAnalysis.face_count > 0))
                  );

                  if (!hasFace || !aiAnalysis) return null;

                  const confidencePct = ((aiAnalysis.confidence || 0.98) * 100).toFixed(1);
                  const statusText = aiAnalysis.status || 'SUCCESS';

                  return (
                    <div style={{
                      marginTop: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      fontSize: '0.78rem',
                      fontWeight: 500,
                    }}>
                      <CheckCircle size={13} />
                      AI 信心度: {confidencePct}% ({statusText})
                    </div>
                  );
                })()}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} /> {new Date(rec.create_at).toLocaleString('zh-TW')}
                </span>
              </div>
            </div>

          </div>
        ))}
      </div>

      {filteredRecords.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
          <p>沒有找到符合條件的考勤歷史紀錄。</p>
        </div>
      )}

    </div>
  );
};
