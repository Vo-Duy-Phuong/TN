import React, { useEffect, useState, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  User as UserIcon,
  Loader2,
  Mail,
  Phone,
  Shield,
  CheckCircle2,
  XCircle,
  Upload,
  ChevronLeft,
  ChevronRight,
  Camera,
  Save,
  Lock,
  KeyRound
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5020/api';
const ROOT_BASE = API_BASE.replace('/api', '');
import { userApi } from '../api/users';
import { roleApi } from '../api/roles';
import type { User, Role } from '../types';
import { useSearch } from '../contexts/SearchContext';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../api/permissions';

type ViewMode = 'LIST' | 'FORM';

const UserPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Pagination & Search
  const { searchQuery } = useSearch();
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    roleId: '',
    isActive: true
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const result = await userApi.getUsers({
        search: debouncedSearch,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        pageNumber: page,
        pageSize: pageSize
      });
      setUsers(result.items);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await roleApi.getAll();
      setRoles(data);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [debouncedSearch, page, statusFilter]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const openForm = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        username: user.username,
        password: '', // Password not editable here
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || '',
        roleId: user.roleId,
        isActive: user.isActive
      });
      setAvatarPreview(getImageUrl(user.avatar));
    } else {
      setSelectedUser(null);
      setFormData({
        username: '',
        password: '',
        fullName: '',
        email: '',
        phone: '',
        roleId: roles.length > 0 ? roles[0].id : '',
        isActive: true
      });
      setAvatarPreview(null);
    }
    setAvatarFile(null);
    setViewMode('FORM');
  };

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${ROOT_BASE}${path.startsWith('/') ? path : '/' + path}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const form = new FormData();
      form.append('FullName', formData.fullName);
      form.append('Email', formData.email);
      form.append('Phone', formData.phone);
      form.append('RoleId', formData.roleId);
      form.append('IsActive', formData.isActive.toString());
      if (avatarFile) form.append('AvatarFile', avatarFile);

      if (selectedUser) {
        await userApi.update(selectedUser.id, form);
        alert('Cập nhật người dùng thành công!');
      } else {
        form.append('Username', formData.username);
        form.append('Password', formData.password);
        await userApi.create(form);
        alert('Tạo người dùng thành công!');
      }
      setViewMode('LIST');
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to save user:', error);
      alert('Lỗi: ' + (error.response?.data?.message || 'Không thể lưu thông tin người dùng'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa người dùng ${user.fullName}?`)) return;
    try {
      await userApi.delete(user.id);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Không thể xóa người dùng này');
    }
  };

  const [showResetModal, setShowResetModal] = useState(false);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !resetPassword) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/admin/reset-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId: resettingUser.id, newPassword: resetPassword })
      });
      if (!res.ok) throw new Error('Không thể đặt lại mật khẩu');
      alert(`Đã đặt lại mật khẩu cho người dùng ${resettingUser.fullName} thành công!`);
      setShowResetModal(false);
      setResetPassword('');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderListView = () => (
    <div className="animate-fade-in">
      {/* Reset Password Modal */}
      {showResetModal && resettingUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card animate-scale-in" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Reset mật khẩu</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
              Đặt lại mật khẩu cho <strong>{resettingUser.fullName}</strong> (@{resettingUser.username})
            </p>
            <form onSubmit={handleAdminResetPassword}>
              <div style={{ marginBottom: '24px' }}>
                <label className="form-label">Mật khẩu mới</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    value={resetPassword} 
                    onChange={e => setResetPassword(e.target.value)} 
                    className="form-input" 
                    placeholder="Ít nhất 6 ký tự..." 
                    style={{ paddingLeft: '40px' }} 
                    autoFocus
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowResetModal(false)} className="action-btn" style={{ flex: 1 }}>Hủy</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 2 }}>
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Xác nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="page-title">Quản lý người dùng</h1>
          <p className="page-subtitle">Quản lý tài khoản, vai trò và quyền truy cập hệ thống</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="form-input"
            style={{ width: 'auto' }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Đã khóa</option>
          </select>
          {hasPermission(PERMISSIONS.Users.Create) && (
            <button onClick={() => openForm()} className="btn-primary" style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={20} /> Thêm người dùng
            </button>
          )}
        </div>
      </div>

      <div className="grid-container" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {isLoading ? (
          <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'center', padding: '100px' }}>
            <Loader2 className="animate-spin" size={48} color="var(--primary)" />
          </div>
        ) : users.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>
            <UserIcon size={64} style={{ opacity: 0.1, marginBottom: '16px' }} />
            <p>Không tìm thấy người dùng nào</p>
          </div>
        ) : (
          users.map(user => (
            <div key={user.id} className="card user-card animate-scale-in" style={{ padding: '24px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
                {hasPermission(PERMISSIONS.Users.Edit) && (
                  <button onClick={() => { setResettingUser(user); setShowResetModal(true); }} className="action-btn" title="Reset mật khẩu" style={{ color: 'var(--primary)' }}>
                    <KeyRound size={16} />
                  </button>
                )}
                {hasPermission(PERMISSIONS.Users.Edit) && (
                  <button onClick={() => openForm(user)} className="action-btn" title="Chỉnh sửa"><Edit2 size={16} /></button>
                )}
                {hasPermission(PERMISSIONS.Users.Delete) && (
                  <button onClick={() => handleDelete(user)} className="action-btn action-btn-danger" title="Xóa"><Trash2 size={16} /></button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', overflow: 'hidden', background: 'var(--primary-lighter)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {user.avatar ? (
                    <img src={getImageUrl(user.avatar) || ''} alt={user.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <UserIcon size={32} color="var(--primary)" />
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{user.fullName}</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>@{user.username}</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                  <Mail size={14} color="var(--primary)" />
                  <span style={{ color: 'var(--text-secondary)' }}>{user.email}</span>
                </div>
                {user.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                    <Phone size={14} color="var(--primary)" />
                    <span style={{ color: 'var(--text-secondary)' }}>{user.phone}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                  <Shield size={14} color="var(--primary)" />
                  <span style={{ fontWeight: 600 }}>{user.roleName || 'Người dùng'}</span>
                </div>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {user.isActive ? (
                  <span className="badge badge-success" style={{ padding: '4px 12px' }}>
                    <CheckCircle2 size={14} /> Đang hoạt động
                  </span>
                ) : (
                  <span className="badge badge-danger" style={{ padding: '4px 12px' }}>
                    <XCircle size={14} /> Đã khóa
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {!isLoading && totalCount > pageSize && (
        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
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
  );

  const renderFormView = () => (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button onClick={() => setViewMode('LIST')} className="action-btn" style={{ width: '40px', height: '40px' }}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="page-title">{selectedUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: '40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '40px', 
              background: 'var(--primary-lighter)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              border: '2px dashed var(--border-strong)'
            }}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <Camera size={32} color="var(--text-muted)" />
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Tải ảnh</p>
              </div>
            )}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '4px', background: 'rgba(0,0,0,0.5)', textAlign: 'center' }}>
              <Upload size={12} color="white" />
            </div>
          </div>
          <input type="file" ref={fileInputRef} hidden onChange={handleAvatarChange} accept="image/*" />
        </div>

        <div className="grid-container" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="form-group">
            <label className="form-label">Tên đăng nhập</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
              disabled={!!selectedUser}
              required
              placeholder="nhập tên đăng nhập..."
            />
          </div>
          {!selectedUser && (
            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <input 
                type="password" 
                className="form-input" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                required
                placeholder="nhập mật khẩu..."
              />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Họ và tên</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.fullName}
              onChange={e => setFormData({...formData, fullName: e.target.value})}
              required
              placeholder="nhập họ tên đầy đủ..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input 
              type="email" 
              className="form-input" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              required
              placeholder="example@mail.com"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Số điện thoại</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.phone}
              maxLength={10}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                setFormData({...formData, phone: val});
              }}
              placeholder="nhập số điện thoại..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Vai trò</label>
            <select 
              className="form-input" 
              value={formData.roleId}
              onChange={e => setFormData({...formData, roleId: e.target.value})}
              required
            >
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input 
            type="checkbox" 
            id="isActive"
            checked={formData.isActive}
            onChange={e => setFormData({...formData, isActive: e.target.checked})}
            style={{ width: '20px', height: '20px' }}
          />
          <label htmlFor="isActive" style={{ fontWeight: 600, cursor: 'pointer' }}>Kích hoạt tài khoản</label>
        </div>

        <div style={{ marginTop: '40px', display: 'flex', gap: '16px' }}>
          <button 
            type="button" 
            onClick={() => setViewMode('LIST')} 
            className="action-btn" 
            style={{ flex: 1, padding: '14px', fontWeight: 600 }}
          >
            Hủy bỏ
          </button>
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isSubmitting}
            style={{ flex: 2, padding: '14px', borderRadius: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {selectedUser ? 'Cập nhật' : 'Tạo mới'}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <main style={{ padding: '24px' }}>
      {viewMode === 'LIST' ? renderListView() : renderFormView()}
    </main>
  );
};

export default UserPage;
