// TEAM_001: History List 歷史資料列表元件
import React, { useState } from 'react';
import { AttendanceRecord } from '../types/attendance';
import { Search, RefreshCw, Eye, Download, Image as ImageIcon, Calendar } from 'lucide-react';

interface HistoryListProps {
  records: AttendanceRecord[];
  onRefresh: () => void;
  onOpenImageModal: (url: string) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  records,
  onRefresh,
  onOpenImageModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // 篩選紀錄
  const filteredRecords = records.filter(
    (rec) =>
      rec.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 頂部操作列：搜尋與重新整理 */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
            <Search size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="搜尋訊息內容或 ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 42px',
                borderRadius: '10px',
                border: '1px solid var(--border-card)',
                background: 'rgba(0,0,0,0.3)',
                color: '#ffffff',
                outline: 'none',
                fontFamily: 'var(--font-main)',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            共搜尋到 <strong style={{ color: 'var(--color-primary)' }}>{filteredRecords.length}</strong> 筆歷史紀錄
          </span>
          <button onClick={onRefresh} className="btn-secondary">
            <RefreshCw size={16} />
            重新整理 (Sync Supabase)
          </button>
        </div>
      </div>

      {/* 歷史紀錄表格區 */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(0, 0, 0, 0.4)', borderBottom: '1px solid var(--border-card)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <th style={{ padding: '16px 20px' }}>縮圖 (File)</th>
                <th style={{ padding: '16px 20px' }}>ID</th>
                <th style={{ padding: '16px 20px' }}>時間戳記 (create_at)</th>
                <th style={{ padding: '16px 20px' }}>訊息內容 (Message)</th>
                <th style={{ padding: '16px 20px', textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec) => (
                  <tr
                    key={rec.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* 縮圖 */}
                    <td style={{ padding: '12px 20px' }}>
                      <div
                        onClick={() => onOpenImageModal(rec.file_url)}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          background: '#090d16',
                          cursor: 'pointer',
                          border: '1px solid var(--border-card)',
                        }}
                      >
                        <img src={rec.file_url} alt="file" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    </td>

                    {/* ID */}
                    <td style={{ padding: '12px 20px', fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {rec.id.substring(0, 8)}...
                    </td>

                    {/* Timestamp */}
                    <td style={{ padding: '12px 20px', fontSize: '0.88rem', color: '#ffffff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} color="var(--color-primary)" />
                        {new Date(rec.create_at).toLocaleString('zh-TW')}
                      </div>
                    </td>

                    {/* Message */}
                    <td style={{ padding: '12px 20px', fontSize: '0.95rem', fontWeight: 500 }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: rec.message.includes('警告') ? 'rgba(248, 113, 113, 0.15)' : 'rgba(56, 189, 248, 0.1)',
                        color: rec.message.includes('警告') ? 'var(--color-danger)' : 'var(--text-main)',
                      }}>
                        {rec.message}
                      </span>
                    </td>

                    {/* 操作 */}
                    <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => onOpenImageModal(rec.file_url)}
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          <Eye size={14} />
                          檢視大圖
                        </button>
                        <a
                          href={rec.file_url}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', textDecoration: 'none' }}
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    <ImageIcon size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                    <p>尚無符合條件的考勤歷史紀錄</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
