import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Lock, 
  Bell, 
  Save, 
  Loader2, 
  Shield, 
  Mail, 
  Phone,
  Camera,
  CheckCircle2,
  AlertCircle,
  Zap,
  ShieldCheck,
  KeyRound
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5020/api';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { userApi } from '../api/users';
import { notificationApi } from '../api/notifications';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { connectionStatus } = useNotifications();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'system'>('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Profile state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Security Question state
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setMessage(null);
    try {
      await userApi.updateProfile(user.id, {
        fullName,
        email,
        phone,
        roleId: user.roleId, // backend needs roleId in UpdateUserDto
        isActive: true
      });
      setMessage({ text: 'Cập nhật hồ sơ thành công!', type: 'success' });
    } catch (error: any) {
      setMessage({ text: error.response?.data?.message || 'Lỗi khi cập nhật hồ sơ', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetSecurityQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityQuestion || !securityAnswer) {
      setMessage({ text: 'Vui lòng điền đầy đủ câu hỏi và câu trả lời', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/auth/set-security-question`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ question: securityQuestion, answer: securityAnswer })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi khi thiết lập câu hỏi');
      
      setMessage({ text: 'Thiết lập câu hỏi bảo mật thành công!', type: 'success' });
      setSecurityAnswer(''); 
    } catch (error: any) {
      setMessage({ text: error.message || 'Lỗi hệ thống', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Mật khẩu xác nhận không khớp', type: 'error' });
      return;
    }
    if (!user) return;
    setIsSubmitting(true);
    setMessage(null);
    try {
      await userApi.changePassword(user.id, newPassword);
      setMessage({ text: 'Đổi mật khẩu thành công!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMessage({ text: error.response?.data?.message || 'Lỗi khi đổi mật khẩu', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerTestNotification = async () => {
    setIsSubmitting(true);
    try {
      await notificationApi.sendTest();
      setMessage({ text: 'Đã gửi thông báo thử nghiệm! Kiểm tra biểu tượng chuông trên góc phải.', type: 'success' });
    } catch (error) {
      setMessage({ text: 'Lỗi khi gửi thông báo thử nghiệm', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 className="page-title">Cài đặt hệ thống</h1>
        <p className="page-subtitle">Quản lý thông tin cá nhân và cấu hình tài khoản</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px' }}>
        {/* Sidebar Tabs */}
        <div className="tab-container" style={{ flexDirection: 'column', width: '260px', height: 'fit-content' }}>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`tab-btn ${activeTab === 'profile' ? 'tab-btn-active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-start', padding: '14px 20px' }}
          >
            <UserIcon size={18} /> Hồ sơ cá nhân
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`tab-btn ${activeTab === 'security' ? 'tab-btn-active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-start', padding: '14px 20px' }}
          >
            <Shield size={18} /> Bảo mật tài khoản
          </button>
          <button 
            onClick={() => setActiveTab('system')}
            className={`tab-btn ${activeTab === 'system' ? 'tab-btn-active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-start', padding: '14px 20px' }}
          >
            <Zap size={18} /> Hệ thống & Gỡ lỗi
          </button>
        </div>

        {/* Content Area */}
        <div className="card" style={{ padding: '32px' }}>
          {message && (
            <div className={`badge ${message.type === 'success' ? 'badge-success' : 'badge-danger'}`} style={{ 
              padding: '16px', borderRadius: '12px', marginBottom: '24px', 
              display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 600,
              width: '100%'
            }}>
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {message.text}
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #00A3FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 800, color: 'white', boxShadow: '0 8px 16px rgba(0, 102, 204, 0.2)' }}>
                    {user?.fullName?.charAt(0)}
                  </div>
                  <button type="button" className="action-btn" style={{ position: 'absolute', bottom: -5, right: -5, width: '36px', height: '36px', padding: 0, borderRadius: '50%', background: 'var(--primary)', color: 'white' }}>
                    <Camera size={14} />
                  </button>
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>{user?.fullName}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{user?.roleName} • VNPT Infrastructure</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                <div>
                  <label className="form-label">Họ và tên</label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="form-input" style={{ paddingLeft: '40px' }} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" style={{ paddingLeft: '40px' }} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Số điện thoại</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="form-input" style={{ paddingLeft: '40px' }} />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px' }}>
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Lưu thay đổi hồ sơ
              </button>
            </form>
          )}

          {activeTab === 'security' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
              {/* Đổi mật khẩu */}
              <form onSubmit={handleChangePassword}>
                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Lock size={20} color="var(--primary)" /> Đổi mật khẩu
                </h3>
                
                <div style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
                  <div>
                    <label className="form-label">Mật khẩu hiện tại</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="form-input" style={{ paddingLeft: '40px' }} />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Mật khẩu mới</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="form-input" style={{ paddingLeft: '40px' }} />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Xác nhận mật khẩu mới</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="form-input" style={{ paddingLeft: '40px' }} />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px' }}>
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                  Cập nhật mật khẩu
                </button>
              </form>

              <hr style={{ border: 'none', borderTop: '1.5px solid var(--border)', width: '100%' }} />

              {/* Câu hỏi bảo mật */}
              <form onSubmit={handleSetSecurityQuestion}>
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ShieldCheck size={20} color="#10B981" /> Câu hỏi bảo mật
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                    Thiết lập câu hỏi bí mật để khôi phục mật khẩu khi bạn không thể truy cập Email.
                  </p>
                </div>
                
                <div style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
                  <div>
                    <label className="form-label">Chọn hoặc nhập câu hỏi của bạn</label>
                    <div style={{ position: 'relative' }}>
                      <Shield size={18} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
                      <textarea 
                        value={securityQuestion} 
                        onChange={(e) => setSecurityQuestion(e.target.value)} 
                        className="form-input" 
                        placeholder="Ví dụ: Tên thành phố bạn sinh ra? / Tên thú cưng đầu tiên?"
                        style={{ paddingLeft: '40px', minHeight: '80px', paddingTop: '12px' }} 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Câu trả lời bí mật</label>
                    <div style={{ position: 'relative' }}>
                      <KeyRound size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input 
                        type="password" 
                        value={securityAnswer} 
                        onChange={(e) => setSecurityAnswer(e.target.value)} 
                        className="form-input" 
                        placeholder="Nhập câu trả lời..."
                        style={{ paddingLeft: '40px' }} 
                      />
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      * Lưu ý: Hãy nhớ kỹ câu trả lời này. Nó sẽ được mã hóa an toàn.
                    </p>
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="action-btn" style={{ background: '#10B981', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px' }}>
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                  Lưu câu hỏi bảo mật
                </button>
              </form>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="animate-fade-in">
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Công cụ gỡ lỗi hệ thống</h3>
              
              <div style={{ padding: '24px', background: 'var(--primary-lighter)', borderRadius: '16px', marginBottom: '24px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontWeight: 700, marginBottom: '4px' }}>Trạng thái kết nối (Real-time)</h4>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Tình trạng kết nối với máy chủ thông báo SignalR</p>
                  </div>
                  <div className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
                    <div style={{ 
                      width: '10px', height: '10px', borderRadius: '50%', 
                      background: connectionStatus === 'connected' ? '#10B981' : connectionStatus === 'connecting' ? '#F59E0B' : '#EF4444',
                      boxShadow: connectionStatus === 'connected' ? '0 0 10px #10B981' : 'none'
                    }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, textTransform: 'capitalize' }}>
                      {connectionStatus === 'connected' ? 'Đã kết nối' : connectionStatus === 'connecting' ? 'Đang kết nối...' : connectionStatus === 'error' ? 'Lỗi kết nối' : 'Đã ngắt kết nối'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ padding: '24px', background: 'rgba(255, 166, 0, 0.05)', border: '1px solid rgba(255, 166, 0, 0.2)', borderRadius: '16px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <Zap size={24} color="#FFA600" />
                  <div>
                    <h4 style={{ fontWeight: 700, color: '#FFA600', marginBottom: '4px' }}>Kiểm tra thông báo thời gian thực</h4>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      Nhấn vào nút bên dưới để gửi một thông báo giả lập đến tài khoản của bạn. 
                      Điều này giúp xác nhận SignalR và hệ thống State Management đang hoạt động chính xác.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={triggerTestNotification}
                  disabled={isSubmitting}
                  className="action-btn" 
                  style={{ width: '100%', padding: '12px', fontWeight: 600 }}
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Bell size={18} />}
                  Gửi thông báo thử nghiệm ngay
                </button>
              </div>

              <div>
                <h4 style={{ fontWeight: 700, marginBottom: '16px' }}>Thông tin phiên bản</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Frontend Version</span>
                    <span>1.2.4-stable</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Backend API</span>
                    <span>v1.0.0 (Core 7.0)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
