import React, { useEffect, useState, useRef } from 'react';
import { 
  Plus,
  Trash2,
  ArrowLeft,
  Wrench,
  Loader2,
  User as UserIcon,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle,
  Upload,
  DollarSign,
  Save
} from 'lucide-react';
import { productApi } from '../api/products';
import { userApi } from '../api/users';
import { repairApi } from '../api/repairs';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../api/permissions';
import { RepairStatus } from '../types';
import type { Repair, Product, User } from '../types';
import { useSearch } from '../contexts/SearchContext';
import { useDebounce } from '../hooks/useDebounce';

type ViewMode = 'LIST' | 'CREATE' | 'DETAIL';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5020/api';
const ROOT_BASE = API_BASE.replace('/api', '');

const RepairPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { hasPermission } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { searchQuery } = useSearch();
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<RepairStatus | ''>('');

  // Form state
  const [formData, setFormData] = useState({
    productId: '',
    technicianId: '',
    problem: '',
    repairNote: '',
    cost: 0,
    status: RepairStatus.Pending as RepairStatus
  });
  
  const [imageBefore, setImageBefore] = useState<File | null>(null);
  const [imageAfter, setImageAfter] = useState<File | null>(null);
  const [previewBefore, setPreviewBefore] = useState<string | null>(null);
  const [previewAfter, setPreviewAfter] = useState<string | null>(null);

  const fileInputBeforeRef = useRef<HTMLInputElement>(null);
  const fileInputAfterRef = useRef<HTMLInputElement>(null);

  const fetchRepairs = async () => {
    setIsLoading(true);
    try {
      const data = await repairApi.getRepairs({ 
        search: debouncedSearch,
        pageNumber: page,
        pageSize: pageSize,
        status: statusFilter !== '' ? statusFilter : undefined
      });
      // Handle both camelCase and PascalCase just in case
      const items = (data as any).items || (data as any).Items || [];
      const total = (data as any).totalCount ?? (data as any).TotalCount ?? 0;
      setRepairs(items);
      setTotalCount(total);
    } catch (error) {
      console.error('Failed to fetch repairs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInitialData = async () => {
    try {
      const [pData, uData] = await Promise.all([
        productApi.getProducts({ pageSize: 100 }),
        userApi.getAll()
      ]);
      const pItems = (pData as any).items || (pData as any).Items || [];
      setProducts(pItems);
      // Filter technicians if possible, otherwise show all
      const techs = (uData || []).filter(u => u.roleCode === 'TECHNICIAN' || u.roleCode === 'ADMIN');
      setTechnicians(techs.length > 0 ? techs : uData);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  useEffect(() => {
    if (viewMode === 'LIST') {
      fetchRepairs();
    } else {
      fetchInitialData();
    }
  }, [viewMode, debouncedSearch, page, pageSize, statusFilter]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'before') {
        setImageBefore(file);
        setPreviewBefore(URL.createObjectURL(file));
      } else {
        setImageAfter(file);
        setPreviewAfter(URL.createObjectURL(file));
      }
    }
  };

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    if (path.startsWith('data:')) return path;
    return `${ROOT_BASE}${path.startsWith('/') ? path : '/' + path}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (viewMode === 'CREATE') {
      if (!formData.productId) return alert('Vui lòng chọn sản phẩm cần sửa');
      if (!formData.technicianId) return alert('Vui lòng chọn kỹ thuật viên');
      if (!formData.problem?.trim()) return alert('Vui lòng mô tả sự cố');
    }

    setIsSubmitting(true);
    
    try {
      const form = new FormData();
      if (viewMode === 'CREATE') {
        form.append('ProductId', formData.productId);
        form.append('TechnicianId', formData.technicianId);
        form.append('Problem', formData.problem.trim());
        form.append('RepairNote', formData.repairNote.trim());
        if (imageBefore) form.append('ImageBeforeFile', imageBefore);
        
        await repairApi.createRepair(form);
        alert('Tạo phiếu sửa chữa thành công!');
      } else if (viewMode === 'DETAIL' && selectedRepair) {
        form.append('Problem', formData.problem.trim());
        form.append('RepairNote', formData.repairNote.trim());
        form.append('Cost', formData.cost.toString());
        form.append('Status', formData.status.toString());
        if (imageBefore) form.append('ImageBeforeFile', imageBefore);
        if (imageAfter) form.append('ImageAfterFile', imageAfter);
        
        await repairApi.updateRepair(selectedRepair.id, form);
        alert('Cập nhật phiếu sửa chữa thành công!');
      }
      
      setViewMode('LIST');
      resetForm();
    } catch (error: any) {
      console.error('Failed to submit repair:', error);
      const errorData = error.response?.data;
      const status = error.response?.status;
      let msg = 'Có lỗi xảy ra khi lưu thông tin';
      
      if (typeof errorData === 'string') msg = errorData;
      else if (errorData?.errors) {
        msg = Object.values(errorData.errors).flat().join('\n');
      } else if (errorData?.message) msg = errorData.message;
      else if (error.message) msg = error.message; // Capture 'Network Error' etc.
      
      alert(`Không thể lưu phiếu (Mã lỗi: ${status || 'Network Error'}):\n${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      technicianId: '',
      problem: '',
      repairNote: '',
      cost: 0,
      status: RepairStatus.Pending
    });
    setImageBefore(null);
    setImageAfter(null);
    setPreviewBefore(null);
    setPreviewAfter(null);
    setSelectedRepair(null);
  };

  const deleteRepair = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phiếu sửa chữa này?')) return;
    try {
      await repairApi.deleteRepair(id);
      fetchRepairs();
    } catch (error) {
      console.error('Failed to delete repair:', error);
      alert('Không thể xóa phiếu sửa chữa');
    }
  };

  const getStatusBadge = (status: RepairStatus) => {
    switch (status) {
      case RepairStatus.Pending:
        return <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}><Clock size={12} /> Chờ sửa</span>;
      case RepairStatus.Repairing:
        return <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: 'rgba(0, 102, 204, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}><Wrench size={12} /> Đang sửa</span>;
      case RepairStatus.Completed:
        return <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}><CheckCircle2 size={12} /> Hoàn thành</span>;
      case RepairStatus.Unrepairable:
        return <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}><XCircle size={12} /> Không thể sửa</span>;
    }
  };

  const renderListView = () => (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={onBack} className="action-btn" style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>Quản lý sửa chữa</h1>
            <p className="page-subtitle">Theo dõi và cập nhật trạng thái thiết bị đang bảo trì</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value === '' ? '' : parseInt(e.target.value) as RepairStatus)}
            className="form-input"
            style={{ width: 'auto' }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value={RepairStatus.Pending}>Chờ sửa</option>
            <option value={RepairStatus.Repairing}>Đang sửa</option>
            <option value={RepairStatus.Completed}>Hoàn thành</option>
            <option value={RepairStatus.Unrepairable}>Không thể sửa</option>
          </select>
          {hasPermission(PERMISSIONS.Repairs.Create) && (
            <button 
              onClick={() => { resetForm(); setViewMode('CREATE'); }}
              className="btn-primary"
              style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={20} /> Tạo phiếu mới
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
        {isLoading ? (
          <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}>
            <Loader2 className="animate-spin" size={40} color="var(--primary)" />
          </div>
        ) : (repairs?.length || 0) === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Wrench size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
            <p>Chưa có phiếu sửa chữa nào</p>
          </div>
        ) : (
          <>
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th style={{ width: '25%', padding: '12px 20px' }}>Sản phẩm</th>
                    <th style={{ width: '20%', padding: '12px 20px' }}>Kỹ thuật viên</th>
                    <th style={{ width: '15%', padding: '12px 20px' }}>Ngày tạo</th>
                    <th style={{ width: '15%', padding: '12px 20px' }}>Trạng thái</th>
                    <th style={{ width: '15%', padding: '12px 20px' }}>Chi phí</th>
                    <th style={{ width: '10%', padding: '12px 20px', textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {repairs.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row-hover">
                      <td style={{ padding: '12px 20px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '15px' }}>{item.productName}</div>
                      </td>
                      <td style={{ padding: '12px 20px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-lighter)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <UserIcon size={16} color="var(--primary)" />
                          </div>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.technicianFullName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 20px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                          {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td style={{ padding: '12px 20px', verticalAlign: 'middle' }}>
                        {getStatusBadge(item.status)}
                      </td>
                      <td style={{ padding: '12px 20px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
                          {item.cost ? item.cost.toLocaleString() + ' đ' : '-'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 20px', textAlign: 'right', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button 
                              onClick={() => {
                                setSelectedRepair(item);
                                setFormData({
                                  productId: item.productId,
                                  technicianId: item.technicianId,
                                  problem: item.problem || '',
                                  repairNote: item.repairNote || '',
                                  cost: item.cost || 0,
                                  status: item.status
                                });
                                setPreviewBefore(getImageUrl(item.imageBefore));
                                setPreviewAfter(getImageUrl(item.imageAfter));
                                setViewMode('DETAIL');
                              }}
                              className="action-btn"
                            >
                              <Eye size={18} />
                            </button>
                            {hasPermission(PERMISSIONS.Repairs.Delete) && (
                              <button 
                                onClick={() => deleteRepair(item.id)}
                                className="action-btn action-btn-danger"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', background: 'var(--primary-lighter)' }}>
               <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  Đang xem <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{repairs?.length || 0}</span> của <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{totalCount}</span> phiếu
               </div>
               <div style={{ display: 'flex', gap: '6px' }}>
                  <button 
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="action-btn"
                    style={{ opacity: page === 1 ? 0.3 : 1 }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button 
                    disabled={page * pageSize >= totalCount}
                    onClick={() => setPage(p => p + 1)}
                    className="action-btn"
                    style={{ opacity: (page * pageSize >= totalCount) ? 0.3 : 1 }}
                  >
                    <ChevronRight size={18} />
                  </button>
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderFormView = () => (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => setViewMode('LIST')} className="action-btn" style={{ width: '40px', height: '40px' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="page-title">
          {viewMode === 'CREATE' ? 'Tạo phiếu sửa chữa' : `Chi tiết phiếu sửa chữa`}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
          <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={20} color="var(--primary)" /> Thông tin thiết bị & Sự cố
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {viewMode === 'CREATE' ? (
                <>
                  <div>
                    <label className="form-label">Sản phẩm cần sửa</label>
                    <select 
                      value={formData.productId}
                      onChange={(e) => setFormData({...formData, productId: e.target.value})}
                      className="form-input"
                      required
                    >
                      <option value="">Chọn sản phẩm...</option>
                      {products?.map(p => (
                        <option key={p.id} value={p.id}>{p.productName} ({p.unit})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Kỹ thuật viên phụ trách</label>
                    <select 
                      value={formData.technicianId}
                      onChange={(e) => setFormData({...formData, technicianId: e.target.value})}
                      className="form-input"
                      required
                    >
                      <option value="">Chọn kỹ thuật viên...</option>
                      {technicians?.map(t => (
                        <option key={t.id} value={t.id}>{t.fullName}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '16px', background: 'var(--primary-lighter)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Sản phẩm</div>
                    <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{selectedRepair?.productName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Kỹ thuật viên</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedRepair?.technicianFullName}</div>
                  </div>
                </div>
              )}

              <div>
                <label className="form-label">Mô tả sự cố</label>
                <textarea 
                  value={formData.problem}
                  onChange={(e) => setFormData({...formData, problem: e.target.value})}
                  className="form-input"
                  style={{ minHeight: '100px' }}
                  placeholder="Mô tả chi tiết tình trạng hư hỏng..."
                  required
                />
              </div>

              <div>
                <label className="form-label">Hình ảnh trước khi sửa</label>
                <div 
                  onClick={() => fileInputBeforeRef.current?.click()}
                  style={{ 
                    width: '100%', 
                    height: '200px', 
                    border: '1.5px dashed var(--border)', 
                    borderRadius: '12px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    background: previewBefore ? 'none' : 'var(--bg-color)',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  {previewBefore ? (
                    <img src={previewBefore} alt="Before" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      <Upload size={32} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Tải ảnh trạng thái trước sửa</span>
                    </>
                  )}
                  <input type="file" ref={fileInputBeforeRef} hidden onChange={(e) => handleImageChange(e, 'before')} accept="image/*" />
                </div>
              </div>

              {viewMode === 'DETAIL' && (
                <div>
                  <label className="form-label">Hình ảnh sau khi sửa</label>
                  <div 
                    onClick={() => fileInputAfterRef.current?.click()}
                    style={{ 
                      width: '100%', 
                      height: '200px', 
                      border: '1.5px dashed var(--border)', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      background: previewAfter ? 'none' : 'var(--bg-color)',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    {previewAfter ? (
                      <img src={previewAfter} alt="After" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <>
                        <Upload size={32} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
                        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Tải ảnh kết quả sau khi sửa</span>
                      </>
                    )}
                    <input type="file" ref={fileInputAfterRef} hidden onChange={(e) => handleImageChange(e, 'after')} accept="image/*" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card">
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} color="var(--primary)" /> Trạng thái & Ghi chú
              </h3>
              
              {viewMode === 'DETAIL' && (
                <div style={{ marginBottom: '20px' }}>
                  <label className="form-label">Trạng thái sửa chữa</label>
                  <select 
                    value={formData.status ?? RepairStatus.Pending}
                    onChange={(e) => setFormData({...formData, status: parseInt(e.target.value) as RepairStatus})}
                    className="form-input"
                  >
                    <option value={RepairStatus.Pending}>Chờ sửa</option>
                    <option value={RepairStatus.Repairing}>Đang sửa</option>
                    <option value={RepairStatus.Completed}>Hoàn thành</option>
                    <option value={RepairStatus.Unrepairable}>Không thể sửa</option>
                  </select>
                </div>
              )}

              {viewMode === 'DETAIL' && (
                <div style={{ marginBottom: '20px' }}>
                  <label className="form-label">Chi phí sửa chữa (VNĐ)</label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="number"
                      value={formData.cost}
                      onChange={(e) => setFormData({...formData, cost: parseInt(e.target.value) || 0})}
                      className="form-input"
                      style={{ paddingLeft: '40px' }}
                      placeholder="Nhập chi phí..."
                    />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Ghi chú kỹ thuật</label>
                <textarea 
                  value={formData.repairNote}
                  onChange={(e) => setFormData({...formData, repairNote: e.target.value})}
                  className="form-input"
                  style={{ minHeight: '120px' }}
                  placeholder="Ghi chú về linh kiện thay thế, phương pháp sửa..."
                />
              </div>

              <button 
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
                style={{ width: '100%', marginTop: '12px', padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                {viewMode === 'CREATE' ? 'Tạo phiếu' : 'Cập nhật phiếu'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );

  return (
    <main>
      {viewMode === 'LIST' ? renderListView() : renderFormView()}
    </main>
  );
};

export default RepairPage;
