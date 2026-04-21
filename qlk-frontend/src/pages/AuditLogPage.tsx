import React, { useEffect, useState } from 'react';
import { 
  History as HistoryIcon, 
  Search, 
  Calendar, 
  Database,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import type { AuditLog } from '../api/audit';
import { auditApi } from '../api/audit';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const result = await auditApi.getLogs(page, pageSize);
      // Backend returns PagedResult with Items and TotalCount
      const items = (result as any).items || (result as any).Items || [];
      const total = (result as any).totalCount || (result as any).TotalCount || 0;
      setLogs(items);
      setTotalCount(total);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'tạo mới': return '#10b981';
      case 'cập nhật': return '#3b82f6';
      case 'xóa': return '#ef4444';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <HistoryIcon size={32} color="var(--primary)" /> Nhật ký hệ thống
          </h1>
          <p className="page-subtitle">Theo dõi mọi thay đổi dữ liệu và thao tác của người dùng</p>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '16px' }}>
          <div className="search-wrapper" style={{ flex: 1 }}>
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm trong nhật ký..." 
              className="form-input" 
              style={{ paddingLeft: '42px' }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Người dùng</th>
                <th>Thao tác</th>
                <th>Đối tượng</th>
                <th>Chi tiết</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '100px', textAlign: 'center' }}>
                    <Loader2 className="animate-spin" size={32} color="var(--primary)" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '100px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Không có nhật ký nào
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} style={{ transition: 'background 0.2s' }} className="table-row-hover">
                    <td style={{ padding: '16px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={14} color="var(--text-muted)" />
                        {format(new Date(log.timestamp), 'HH:mm:ss dd/MM/yyyy', { locale: vi })}
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                          {log.userFullName?.charAt(0) || 'H'}
                        </div>
                        {log.userFullName || 'Hệ thống'}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontSize: '12px', 
                        fontWeight: 600,
                        background: `${getActionColor(log.action)}15`,
                        color: getActionColor(log.action),
                        border: `1px solid ${getActionColor(log.action)}30`
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Database size={14} color="var(--text-muted)" />
                        <span style={{ fontWeight: 600 }}>{log.entityName}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({log.entityId.substring(0, 8)}...)</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', maxWidth: '300px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Info size={14} color="var(--primary)" />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.changes || 'Không có chi tiết'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {log.remoteIpAddress || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && totalCount > pageSize && (
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', gap: '12px', background: 'var(--primary-lighter)', borderTop: '1px solid var(--border)' }}>
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="action-btn"
              style={{ opacity: page === 1 ? 0.5 : 1 }}
            >
              <ChevronLeft size={18} /> Trước
            </button>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', fontWeight: 600 }}>
              Trang {page} / {Math.ceil(totalCount / pageSize)}
            </div>
            <button 
              disabled={page * pageSize >= totalCount}
              onClick={() => setPage(p => p + 1)}
              className="action-btn"
              style={{ opacity: page * pageSize >= totalCount ? 0.5 : 1 }}
            >
              Tiếp <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
      <style>{`
        .table-row-hover:hover td {
          background: var(--primary-lighter);
        }
      `}</style>
    </div>
  );
};

export default AuditLogPage;
