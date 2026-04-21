import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Search, 
  CheckCircle, 
  ShieldCheck,
  XCircle, 
  Clock, 
  User as UserIcon,
  Phone,
  MapPin,
  Settings,
  Briefcase,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { serviceRequestApi } from '../api/serviceRequests';
import { userApi } from '../api/users';
import { ServiceStatus, type ServiceRequest, type User } from '../types';

const ServiceRequestPage: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState({ search: '', status: undefined as ServiceStatus | undefined });

  const [assignTechId, setAssignTechId] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const isTechnician = user?.roleCode === 'TECHNICIAN';
  const [showMyTasks, setShowMyTasks] = useState(isTechnician);

  useEffect(() => {
    fetchData();
    if (!isTechnician) fetchTechnicians();
  }, [filter, showMyTasks]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await serviceRequestApi.getRequests({
        search: filter.search,
        status: filter.status,
        assignedTechnicianId: (showMyTasks && user) ? user.id : undefined,
        pageSize: 50
      });
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch service requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const users = await userApi.getAll();
      setTechnicians(users.filter(u => u.roleCode === 'TECHNICIAN' || u.roleCode === 'ADMIN'));
    } catch (error) {
      console.error('Failed to fetch techs:', error);
    }
  };

  const handleProcess = async (status: ServiceStatus) => {
    if (!selectedRequest) return;
    setIsProcessing(true);
    try {
      await serviceRequestApi.process(selectedRequest.id, {
        status,
        adminNote,
        assignedTechnicianId: assignTechId || undefined
      });
      setIsModalOpen(false);
      setSelectedRequest(null);
      setAdminNote('');
      setAssignTechId('');
      fetchData();
    } catch (error) {
      alert('Thao tác thất bại');
    } finally {
      setIsProcessing(false);
    }
  };

  const openModal = (req: ServiceRequest) => {
    setSelectedRequest(req);
    setAdminNote(req.adminNote || '');
    setAssignTechId(req.assignedTechnicianId || '');
    setIsModalOpen(true);
  };

  const getStatusInfo = (status: ServiceStatus) => {
    const statusMap = {
      [ServiceStatus.Pending]:   { label: 'Chờ duyệt',       color: '#F59E0B', icon: <Clock size={14} /> },
      [ServiceStatus.Approved]:  { label: 'Đã duyệt',        color: '#10B981', icon: <CheckCircle size={14} /> },
      [ServiceStatus.Assigned]:  { label: 'Đang triển khai', color: '#3B82F6', icon: <Briefcase size={14} /> },
      [ServiceStatus.Completed]: { label: 'Hoàn thành',      color: '#8B5EF2', icon: <ShieldCheck size={14} /> },
      [ServiceStatus.Cancelled]: { label: 'Đã hủy',          color: '#EF4444', icon: <XCircle size={14} /> },
    };
    return statusMap[status] || { label: 'Không xác định', color: '#94a3b8', icon: <Settings size={14} /> };
  };

  return (
    <>
      <div className="animate-fade-in">
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 className="page-title">Yêu cầu dịch vụ khách hàng</h1>
          <p className="page-subtitle">
            {isTechnician
              ? 'Danh sách công việc được phân công cho bạn'
              : 'Tiếp nhận, phê duyệt và điều phối kỹ thuật hỗ trợ khách hàng'}
          </p>
        </div>

        {/* Filter bar */}
        <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Tìm kiếm khách hàng, SĐT, địa chỉ..."
                className="form-input"
                style={{ paddingLeft: '48px' }}
                value={filter.search}
                onChange={e => setFilter({ ...filter, search: e.target.value })}
              />
            </div>

            <select
              className="form-input"
              style={{ width: '200px' }}
              value={filter.status ?? ''}
              onChange={e => setFilter({ ...filter, status: e.target.value === '' ? undefined : (Number(e.target.value) as ServiceStatus) })}
            >
              <option value="">Tất cả trạng thái</option>
              <option value={ServiceStatus.Pending}>Chờ duyệt</option>
              <option value={ServiceStatus.Approved}>Đã duyệt</option>
              <option value={ServiceStatus.Assigned}>Đang triển khai</option>
              <option value={ServiceStatus.Completed}>Hoàn thành</option>
              <option value={ServiceStatus.Cancelled}>Đã hủy</option>
            </select>

            {isTechnician && (
              <button
                onClick={() => setShowMyTasks(!showMyTasks)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px',
                  background: showMyTasks ? 'var(--primary)' : 'white',
                  color: showMyTasks ? 'white' : 'var(--text-primary)',
                  border: '1.5px solid var(--primary)', borderRadius: '12px',
                  fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <UserCheck size={18} />
                {showMyTasks ? 'Đang xem việc của tôi' : 'Xem việc của tôi'}
              </button>
            )}
          </div>
        </div>

        {/* Request list */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <Clock className="animate-spin" /> Đang tải...
            </div>
          ) : requests.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '80px' }}>
              <ClipboardList size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
              <p style={{ color: 'var(--text-muted)' }}>Không có yêu cầu nào.</p>
            </div>
          ) : (
            requests.map(req => (
              <div
                key={req.id}
                className="card animate-scale-in"
                style={{
                  padding: '24px', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', borderLeft: `4px solid ${getStatusInfo(req.status).color}`
                }}
              >
                {/* Info & Actions same as before */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-lighter)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserIcon size={24} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{req.customerName}</h3>
                      <span className="badge" style={{ background: `${getStatusInfo(req.status).color}15`, color: getStatusInfo(req.status).color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {getStatusInfo(req.status).icon} {getStatusInfo(req.status).label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={14} /> {req.phoneNumber}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {req.address}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 600 }}>{req.serviceType}</span>
                    </div>
                  </div>
                </div>

                <button onClick={() => openModal(req)} className="action-btn">
                  {isTechnician ? <CheckCircle size={18} /> : <Settings size={18} />}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===== MODAL OUTSIDE THE TRANSFORM CONTAINER ===== */}
      {isModalOpen && selectedRequest && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card animate-scale-in" style={{ width: '680px', maxWidth: '100%', borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px rgba(0,0,0,0.4)', position: 'relative' }}>
            <div style={{ padding: '20px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserIcon size={18} />
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Xử lý: {selectedRequest.customerName}</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Đóng (Esc)</button>
              </div>

              {isTechnician ? (
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ flex: 1, background: '#f0fdf4', padding: '12px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{selectedRequest.address}</div>
                    <div style={{ fontSize: '12px', color: '#16a34a' }}>📞 {selectedRequest.phoneNumber}</div>
                  </div>
                  <button
                    onClick={() => handleProcess(ServiceStatus.Completed)}
                    disabled={isProcessing}
                    style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}
                  >
                    {isProcessing ? '...' : '✓ XÁC NHẬN'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', background: '#eff6ff', padding: '12px', borderRadius: '12px', border: '1px solid #dbeafe' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#1e40af', display: 'block', marginBottom: '4px' }}>❶ PHÂN CÔNG KỸ THUẬT</label>
                      <select className="form-input" value={assignTechId} onChange={e => setAssignTechId(e.target.value)} style={{ height: '42px', border: '1.5px solid #3b82f6', fontSize: '14px' }}>
                        <option value="">-- Chọn người thực hiện --</option>
                        {technicians.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                      </select>
                    </div>
                    <button onClick={() => handleProcess(ServiceStatus.Assigned)} disabled={isProcessing || !assignTechId} className="btn-primary" style={{ height: '42px', padding: '0 20px', fontSize: '14px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                      🔧 PHÂN CÔNG
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', background: '#f0fdf4', padding: '12px', borderRadius: '12px', border: '1px solid #dcfce7' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#16a34a', display: 'block', marginBottom: '4px' }}>❷ GHI CHÚ & PHÊ DUYỆT</label>
                      <textarea className="form-input" placeholder="Ghi chú nhanh..." value={adminNote} onChange={e => setAdminNote(e.target.value)} style={{ height: '42px', minHeight: '42px', fontSize: '13px', paddingTop: '10px' }} />
                    </div>
                    <button onClick={() => handleProcess(ServiceStatus.Approved)} disabled={isProcessing} style={{ height: '42px', padding: '0 20px', background: '#10B981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}>
                      ✓ DUYỆT
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 4px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', gap: '15px', color: 'var(--text-secondary)' }}>
                      <span>📱 <strong>{selectedRequest.phoneNumber}</strong></span>
                      <span>🌐 {selectedRequest.serviceType}</span>
                    </div>
                    <button onClick={() => handleProcess(ServiceStatus.Cancelled)} disabled={isProcessing} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}>Hủy yêu cầu</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ServiceRequestPage;
