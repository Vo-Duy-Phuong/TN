import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Warehouse as WarehouseIcon, 
  MapPin, 
  User as UserIcon, 
  Edit2, 
  Trash2, 
  Loader2, 
  Save, 
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { warehouseApi, type Warehouse } from '../api/warehouses';
import { userApi } from '../api/users';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../api/permissions';
import type { User } from '../types';

const WarehousePage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Form state
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [managerId, setManagerId] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [{ items, totalCount: count }, uData] = await Promise.all([
        warehouseApi.getAll({ pageNumber: page, pageSize, search: searchQuery }),
        userApi.getAll()
      ]);
      setWarehouses(items);
      setTotalCount(count);
      setUsers(uData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, searchQuery]);

  const handleOpenModal = (warehouse?: Warehouse) => {
    if (warehouse) {
      setCurrentId(warehouse.id);
      setName(warehouse.warehouseName);
      setLocation(warehouse.location);
      setManagerId(warehouse.managerId);
    } else {
      setCurrentId(null);
      setName('');
      setLocation('');
      setManagerId(users[0]?.id || '');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = { warehouseName: name, location, managerId };
      if (currentId) {
        await warehouseApi.update(currentId, data);
      } else {
        await warehouseApi.create(data);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save warehouse:', error);
      alert('Lỗi khi lưu thông tin kho hàng');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa kho hàng này?')) {
      try {
        await warehouseApi.delete(id);
        fetchData();
      } catch (error) {
        console.error('Failed to delete warehouse:', error);
        alert('Lỗi khi xóa kho hàng');
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="page-title">Quản lý kho hàng</h1>
          <p className="page-subtitle">Quản lý hệ thống các điểm lưu trữ hàng hóa</p>
        </div>
        {hasPermission(PERMISSIONS.Warehouses.Create) && (
          <button 
            onClick={() => handleOpenModal()}
            className="btn-primary"
            style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={20} /> Thêm kho mới
          </button>
        )}
      </div>

      <div className="search-wrapper" style={{ marginBottom: '24px', maxWidth: '400px' }}>
        <Search className="search-icon" size={18} />
        <input 
          type="text" 
          placeholder="Tìm kiếm kho hàng..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-input"
          style={{ paddingLeft: '42px' }} 
        />
      </div>

      {isLoading ? (
        <div style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 className="animate-spin" size={40} color="var(--primary)" />
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {warehouses.map((warehouse) => (
              <div key={warehouse.id} className="card warehouse-card" style={{ transition: 'transform 0.2s', cursor: 'default' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ padding: '10px', background: 'var(--primary-lighter)', borderRadius: '12px' }}>
                    <WarehouseIcon size={24} color="var(--primary)" />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {hasPermission(PERMISSIONS.Warehouses.Edit) && (
                      <button onClick={() => handleOpenModal(warehouse)} className="action-btn">
                        <Edit2 size={16} />
                      </button>
                    )}
                    {hasPermission(PERMISSIONS.Warehouses.Delete) && (
                      <button onClick={() => handleDelete(warehouse.id)} className="action-btn action-btn-danger">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{warehouse.warehouseName}</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '14px' }}>
                  <MapPin size={14} />
                  <span>{warehouse.location}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'var(--primary-lighter)', borderRadius: '12px', marginTop: '16px', border: '1px solid var(--border)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
                    {warehouse.managerName?.charAt(0) || <UserIcon size={14} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '1px' }}>Quản lý kho</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{warehouse.managerName || 'Chưa gán'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'var(--primary-lighter)', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Đang xem <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{warehouses.length}</span> của <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{totalCount}</span> kho hàng
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Hiển thị:</span>
                <select 
                  value={pageSize}
                  onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1); }}
                  className="form-input"
                  style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '12px', width: 'auto' }}
                >
                  {[10, 20, 50].map(size => <option key={size} value={size}>{size}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="action-btn"
                style={{ opacity: page === 1 ? 0.3 : 1 }}
              >
                <ChevronLeft size={18} />
              </button>

              {Array.from({ length: Math.ceil(totalCount / pageSize) }).map((_, i) => {
                const p = i + 1;
                const totalPages = Math.ceil(totalCount / pageSize);
                if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                  return (
                    <button 
                      key={p}
                      onClick={() => setPage(p)}
                      className={page === p ? 'pagination-btn-active' : 'action-btn'}
                      style={{ minWidth: '38px', height: '38px', fontWeight: 700, fontSize: '14px' }}
                    >
                      {p}
                    </button>
                  );
                }
                if (p === page - 2 || p === page + 2) return <span key={p} style={{ color: 'var(--text-muted)', margin: '0 4px' }}>...</span>;
                return null;
              })}

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

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card animate-scale-in" style={{ width: '100%', maxWidth: '450px', position: 'relative' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>{currentId ? 'Chỉnh sửa kho hàng' : 'Thêm kho hàng mới'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Tên kho hàng</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  placeholder="VD: Kho Vật Tư"
                  required
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Địa điểm / Vị trí</label>
                <input 
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="form-input"
                  placeholder="VD: Khu vực B, Tầng 2"
                  required
                />
              </div>
              
              <div style={{ marginBottom: '32px' }}>
                <label className="form-label">Người quản lý kho</label>
                <select 
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="form-input"
                  required
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName} ({u.roleName})</option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="action-btn"
                  style={{ flex: 1, padding: '12px', fontWeight: 600 }}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                  style={{ flex: 2, padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Lưu thông tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`
        .pagination-btn {
          background: rgba(255, 255, 255, 0.03);
          color: white;
          transition: all 0.2s;
        }
        .pagination-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }
        .pagination-btn-active {
          background: var(--primary);
          color: white;
          box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
        }
      `}</style>
    </div>
  );
};

export default WarehousePage;
