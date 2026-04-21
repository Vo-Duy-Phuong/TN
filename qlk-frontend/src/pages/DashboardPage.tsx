import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Package,
  Warehouse,
  Users,
  Wrench,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Activity,
  ClipboardList,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  Briefcase
} from 'lucide-react';
import { motion } from 'framer-motion';
import { dashboardApi } from '../api/dashboard';
import { serviceRequestApi } from '../api/serviceRequests';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { ServiceStatus } from '../types';
import type { ServiceRequest, MonthlyStats, DashboardStats } from '../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler,
  RadialLinearScale,
  ArcElement
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';
import type { PageView } from '../App';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler,
  RadialLinearScale,
  ArcElement
);

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  color: string;
}> = ({ title, value, icon, trend, color }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="card"
    style={{ flex: 1, minWidth: '240px' }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color
      }}>
        {icon}
      </div>
      {trend && (
        <div className={`trend-badge ${trend.positive ? 'trend-positive' : 'trend-negative'}`} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '13px',
          padding: '4px 8px',
          borderRadius: '20px',
          height: 'fit-content',
          fontWeight: 600
        }}>
          {trend.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend.value}
        </div>
      )}
    </div>
    <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>{title}</div>
    <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{value}</div>
  </motion.div>
);

const DashboardPage: React.FC<{ onNavigate?: (page: PageView) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isTechnician = user?.roleCode === 'TECHNICIAN';

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [myTasks, setMyTasks] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises: Promise<any>[] = [
          dashboardApi.getStats(),
          dashboardApi.getMonthlyStats(7)
        ];

        if (isTechnician && user) {
          promises.push(
            serviceRequestApi.getRequests({ assignedTechnicianId: user.id, pageSize: 10 })
          );
        }

        const results = await Promise.all(promises);
        setStats(results[0]);
        setMonthlyStats(results[1]);
        if (isTechnician && results[2]) {
          setMyTasks(results[2]);
        }
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err.response?.data?.message || err.message || 'Không thể lấy dữ liệu từ server');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isTechnician, user?.id]);

  const downloadFile = (data: any, fileName: string, contentType: string) => {
    // Ensure data is treated as a blob with the correct type
    const blob = (data instanceof Blob) ? data : new Blob([data], { type: contentType });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.visibility = 'hidden';
    link.style.position = 'absolute';
    link.target = '_blank'; // Some browsers handle blobs better in new tabs/windows

    document.body.appendChild(link);

    // Explicitly trigger the click
    link.click();

    // Clean up after a short delay to ensure browser processed the click
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
  };

  const handleExport = async () => {
    try {
      const data = await dashboardApi.exportStats();
      downloadFile(data, `Bao_cao_tong_quan_${format(new Date(), 'yyyyMMdd')}.csv`, 'text/csv;charset=utf-8');
    } catch (err) {
      console.error('Failed to export report:', err);
      alert('Lỗi khi xuất báo cáo CSV');
    }
  };

  const handleExportExcel = async () => {
    try {
      const data = await dashboardApi.exportExcel();
      downloadFile(data, `Bao_cao_tong_quan_${format(new Date(), 'yyyyMMdd')}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } catch (err) {
      console.error('Failed to export Excel:', err);
      alert('Lỗi khi xuất báo cáo Excel');
    }
  };

  const handleExportPdf = async () => {
    try {
      const data = await dashboardApi.exportPdf();
      downloadFile(data, `Bao_cao_tong_quan_${format(new Date(), 'yyyyMMdd')}.pdf`, 'application/pdf');
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Lỗi khi xuất báo cáo PDF');
    }
  };

  // Moved inside render

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#475569',
          font: { size: 12 },
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#0F172A',
        bodyColor: '#475569',
        borderColor: '#DDE8F5',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        boxShadow: '0 4px 12px rgba(0,102,204,0.15)'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 102, 204, 0.06)',
        },
        ticks: {
          color: '#94A3B8',
          font: { size: 11 }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#94A3B8',
          font: { size: 11 }
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={40} color="var(--primary)" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          padding: '24px',
          borderRadius: '16px',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <AlertTriangle size={48} color="var(--error)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Lỗi tải dữ liệu</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error}</p>
          <button
            className="btn-primary"
            onClick={() => window.location.reload()}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const chartData = {
    labels: monthlyStats.map(s => s.monthLabel),
    datasets: [
      {
        label: 'Số lượng nhập',
        data: monthlyStats.map(s => s.importCount),
        backgroundColor: 'rgba(0, 102, 204, 0.7)',
        borderColor: 'rgb(0, 102, 204)',
        borderWidth: 0,
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(0, 102, 204, 0.9)',
      },
      {
        label: 'Số lượng xuất',
        data: monthlyStats.map(s => s.exportCount),
        backgroundColor: 'rgba(14, 165, 233, 0.5)',
        borderColor: 'rgb(14, 165, 233)',
        borderWidth: 0,
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(14, 165, 233, 0.8)',
      }
    ],
  };

  const categoryChartData = {
    labels: stats.categoryStats?.map((c: any) => c.name) || [],
    datasets: [
      {
        label: 'Số lượng thiết bị',
        data: stats.categoryStats?.map((c: any) => c.count) || [],
        backgroundColor: 'rgba(0, 102, 204, 0.15)',
        borderColor: 'rgb(0, 102, 204)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(0, 102, 204)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(0, 102, 204)',
      }
    ],
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Tổng quan hệ thống</h1>
          <p className="page-subtitle">Chào mừng bạn quay lại, hôm nay có 5 thông báo mới.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }} className="group">
            <button
              className="action-btn"
              style={{ color: 'var(--primary)', fontWeight: 700, gap: '8px', padding: '10px 18px' }}
            >
              <BarChart3 size={18} /> Xuất báo cáo
            </button>
            <div className="group-hover:block" style={{
              display: 'none',
              position: 'absolute',
              top: '100%',
              right: 0,
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '8px',
              zIndex: 100,
              minWidth: '180px',
              marginTop: '8px',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <button onClick={handleExportPdf} style={{ width: '100%', padding: '10px 12px', textAlign: 'left', borderRadius: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }} className="hover-bg">Xuất PDF (.pdf)</button>
              <button onClick={handleExportExcel} style={{ width: '100%', padding: '10px 12px', textAlign: 'left', borderRadius: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }} className="hover-bg">Xuất Excel (.xlsx)</button>
              <button onClick={handleExport} style={{ width: '100%', padding: '10px 12px', textAlign: 'left', borderRadius: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }} className="hover-bg">Xuất CSV (.csv)</button>
            </div>
          </div>
          <style>{`
            .group:hover div { display: block !important; }
            .hover-bg:hover { background: var(--primary-lighter) !important; color: var(--primary) !important; }
          `}</style>
          <button
            className="btn-primary"
            style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)' }}
            onClick={() => onNavigate?.('imports')}
          >
            + Nhập kho mới
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <StatCard
          title="Tổng sản phẩm"
          value={stats.totalProducts?.toLocaleString() || '0'}
          icon={<Package size={24} />}
          trend={{ value: '12%', positive: true }}
          color="#0066CC"
        />
        <StatCard
          title="Kho hàng"
          value={stats.totalWarehouses || 0}
          icon={<Warehouse size={24} />}
          color="#8B5CF6"
        />
        <StatCard
          title="Đang sửa chữa"
          value={stats.pendingRepairs || 0}
          icon={<Wrench size={24} />}
          trend={{ value: '2', positive: false }}
          color="#F59E0B"
        />
        <StatCard
          title="Tồn kho thấp"
          value={stats.lowStockCount || 0}
          icon={<AlertTriangle size={24} />}
          color="#EF4444"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>Cơ cấu danh mục (Radar)</h3>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {stats.categoryStats?.length > 0 ? (
              <Radar data={categoryChartData} options={{
                scales: {
                  r: {
                    grid: { color: 'rgba(0, 102, 204, 0.08)' },
                    angleLines: { color: 'rgba(0, 102, 204, 0.1)' },
                    pointLabels: { color: '#475569', font: { size: 11 } },
                    ticks: { display: false, backdropColor: 'transparent' }
                  }
                },
                plugins: { legend: { display: false } }
              }} />
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Không có dữ liệu danh mục</p>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} color="var(--primary)" /> Dự báo rủi ro hết hàng (AI)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(!stats.riskForecasts || stats.riskForecasts.length === 0) ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Chưa có đủ dữ liệu để dự báo
              </div>
            ) : (
              stats.riskForecasts.map((f, i) => (
                <div key={i} className="card-accent" style={{ 
                  padding: '16px', 
                  borderRadius: '16px', 
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: (f.daysRemaining ?? 0) <= 7 ? 'var(--error)' : 'var(--primary)' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>{f.productName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Activity size={12} /> Tiêu thụ: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.consumptionRate}</span> /ngày
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', background: (f.daysRemaining ?? 0) <= 7 ? 'var(--error-bg)' : 'var(--primary-lighter)', padding: '8px 12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: 800, 
                      color: (f.daysRemaining ?? 0) <= 7 ? 'var(--error)' : 'var(--primary)' 
                    }}>
                      {f.daysRemaining} ngày
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Còn lại</div>
                  </div>
                </div>
              ))
            )}
          </div>
          {stats.riskForecasts?.length > 0 && (
            <p style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
              * Dự báo dựa trên tốc độ tiêu thụ 30 ngày qua
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Biểu đồ Nhập/Xuất</h3>
            <select style={{ background: 'none', color: 'var(--text-secondary)', border: 'none', outline: 'none' }}>
              <option>7 ngày qua</option>
              <option>30 ngày qua</option>
            </select>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            {monthlyStats.length > 0 ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'var(--primary-lighter)', borderRadius: '12px' }}>
                <div style={{ textAlign: 'center' }}>
                  <TrendingUp size={48} style={{ opacity: 0.3, marginBottom: '16px', color: 'var(--primary)' }} />
                  <p>Không có dữ liệu biểu đồ</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>Hoạt động gần đây</h3>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {(!stats.recentActivities || stats.recentActivities.length === 0) ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Không có hoạt động nào.
              </div>
            ) : (
              stats.recentActivities.map((activity, index) => (
                <div key={index} style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: index === stats.recentActivities.length - 1 ? 'none' : '1px solid var(--border)'
                }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'var(--primary-lighter)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Users size={16} color="var(--primary)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{activity.message}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {format(new Date(activity.createdAt), 'HH:mm dd/MM', { locale: vi })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* My Tasks section - Only for Technicians */}
      {isTechnician && (
        <div className="card animate-fade-in" style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-lighter)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <ClipboardList size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Công việc được phân công</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {myTasks.length > 0 ? `Bạn có ${myTasks.length} yêu cầu đang chờ` : 'Không có công việc mới'}
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate?.('service-requests')}
              className="action-btn"
              style={{ color: 'var(--primary)', fontWeight: 600, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              Xem tất cả →
            </button>
          </div>

          {myTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: '12px' }}>
              <ClipboardList size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
              <p>Chưa có công việc nào được phân công.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
              {myTasks.map(task => {
                const statusColorMap: Record<number, { bg: string; color: string; label: string; icon: React.ReactNode }> = {
                  [ServiceStatus.Pending]: { bg: '#FEF3C7', color: '#D97706', label: 'Chờ duyệt', icon: <Clock size={13} /> },
                  [ServiceStatus.Approved]: { bg: '#D1FAE5', color: '#059669', label: 'Đã duyệt', icon: <CheckCircle size={13} /> },
                  [ServiceStatus.Assigned]: { bg: '#DBEAFE', color: '#2563EB', label: 'Đang triển khai', icon: <Briefcase size={13} /> },
                  [ServiceStatus.Completed]: { bg: '#EDE9FE', color: '#7C3AED', label: 'Hoàn thành', icon: <CheckCircle size={13} /> },
                  [ServiceStatus.Cancelled]: { bg: '#FEE2E2', color: '#DC2626', label: 'Đã hủy', icon: <Clock size={13} /> },
                };
                const s = statusColorMap[task.status] || { bg: '#f1f5f9', color: '#64748b', label: 'Không xác định', icon: null };
                return (
                  <motion.div
                    key={task.id}
                    whileHover={{ y: -3 }}
                    style={{
                      padding: '20px',
                      borderRadius: '16px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderLeft: `4px solid ${s.color}`,
                      boxShadow: 'var(--shadow-sm)',
                      cursor: 'pointer'
                    }}
                    onClick={() => onNavigate?.('service-requests')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <h4 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>{task.customerName}</h4>
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        background: s.bg, color: s.color,
                        padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600
                      }}>
                        {s.icon} {s.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={13} color="var(--primary)" /> {task.phoneNumber}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={13} color="var(--primary)" /> {task.address}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: 600 }}>
                        <Briefcase size={13} /> {task.serviceType}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                      Phân công lúc: {format(new Date(task.updatedAt || task.createdAt), 'HH:mm dd/MM/yyyy', { locale: vi })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
