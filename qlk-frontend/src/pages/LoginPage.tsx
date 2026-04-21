import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Warehouse, 
  User as UserIcon, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2,
  ArrowLeft,
  CheckCircle2,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5020/api';

type ForgotStep = 'identify' | 'question' | 'success';

const ForgotPasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [step, setStep] = useState<ForgotStep>('identify');
  const [identifier, setIdentifier] = useState(''); // Username or Email
  const [userInfo, setUserInfo] = useState<{ email?: string, username?: string, question?: string } | null>(null);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) { setError('Vui lòng nhập tên đăng nhập.'); return; }
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/security-question/${identifier.trim()}`);
      const data = await res.json();
      
      if (!res.ok) {
        const msg = identifier.trim().toLowerCase() === 'admin' 
          ? 'Tài khoản admin chưa thiết lập câu hỏi bảo mật.' 
          : 'Tài khoản này không hỗ trợ tự khôi phục. Vui lòng liên hệ Admin để đặt lại mật khẩu.';
        throw new Error(msg);
      }

      setUserInfo({ 
        username: identifier.trim(),
        question: data.question 
      });
      setStep('question');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };


  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'question' && !securityAnswer.trim()) { setError('Vui lòng nhập câu trả lời.'); return; }
    
    if (!newPassword) { setError('Vui lòng nhập mật khẩu mới.'); return; }
    if (newPassword.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự.'); return; }
    if (newPassword !== confirmPassword) { setError('Mật khẩu xác nhận không khớp.'); return; }
    
    setError(null);
    setIsLoading(true);
    try {
      let res = await fetch(`${API_BASE}/auth/reset-password-by-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: identifier.trim(), securityAnswer: securityAnswer.trim(), newPassword })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Đặt lại mật khẩu thất bại.');
      setStep('success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: '440px',
            background: 'white',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: '0 24px 80px rgba(0,102,204,0.25), 0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,102,204,0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Top accent */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
            background: 'linear-gradient(90deg, #0066CC, #0EA5E9, #38BDF8)'
          }} />

          {/* Close button */}
          {step !== 'success' && (
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: '20px', right: '20px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: '6px',
                borderRadius: '10px', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center'
              }}
            >
              <X size={20} />
            </button>
          )}

          {/* STEP 1: Identification */}
          {step === 'identify' && (
            <motion.div key="step-identify" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
              <div style={{ marginBottom: '32px' }}>
                <div style={{
                  width: '56px', height: '56px',
                  background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
                  borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '16px', border: '1px solid rgba(0,102,204,0.15)'
                }}>
                  <UserIcon size={26} color="#0066CC" />
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Quên mật khẩu?
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                  Nhập tên đăng nhập của bạn để khôi phục bằng câu hỏi bảo mật.
                </p>
              </div>
              <form onSubmit={handleIdentify}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '13.5px', fontWeight: 600 }}>
                    Tên đăng nhập
                  </label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Nhập username..."
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '44px', height: '48px' }}
                      autoFocus
                    />
                  </div>
                </div>
                {error && <div style={{ marginBottom: '20px', color: 'var(--error)', fontSize: '13px', padding: '12px', background: 'rgba(239,68,68,0.08)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>⚠️ {error}</div>}
                <button type="submit" disabled={isLoading} className="btn-primary" style={{ width: '100%', height: '48px' }}>
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Tiếp tục'}
                </button>
              </form>
            </motion.div>
          )}



          {/* STEP: Question */}
          {step === 'question' && (
            <motion.div key="step-question" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
              <button onClick={() => setStep('identify')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '20px', cursor: 'pointer', fontSize: '13px' }}>
                <ArrowLeft size={14} /> Quay lại
              </button>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Câu hỏi bảo mật</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', background: 'var(--bg-color)', padding: '12px', borderRadius: '10px' }}>
                   {userInfo?.question}
                </p>
              </div>
              <form onSubmit={handleResetPassword}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '13.5px', fontWeight: 600 }}>Trả lời</label>
                  <input type="password" placeholder="Nhập câu trả lời..." value={securityAnswer} onChange={e => setSecurityAnswer(e.target.value)} className="form-input" autoFocus />
                </div>
                <div style={{ marginBottom: '16px' }}>
                   <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Mật khẩu mới</label>
                   <input type="password" placeholder="Ít nhất 6 ký tự" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="form-input" />
                </div>
                <div style={{ marginBottom: '24px' }}>
                   <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Xác nhận mật khẩu</label>
                   <input type="password" placeholder="Nhập lại mật khẩu" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="form-input" />
                </div>
                {error && <div style={{ marginBottom: '20px', color: 'var(--error)', fontSize: '13px' }}>⚠️ {error}</div>}
                <button type="submit" disabled={isLoading} className="btn-primary" style={{ width: '100%', height: '48px' }}>
                   {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Xác nhận & Đặt lại'}
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP: Success */}
          {step === 'success' && (
            <motion.div key="step-success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', background: '#10B981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CheckCircle2 size={40} color="white" />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '10px' }}>Thành công!</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '28px' }}>Mật khẩu đã được đặt lại.</p>
              <button onClick={onClose} className="btn-primary" style={{ padding: '13px 32px' }}>Đăng nhập ngay</button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #E8F4FD 0%, #D6EAF8 40%, #EBF5FB 100%)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '400px', height: '400px', background: '#0066CC', filter: 'blur(80px)', opacity: 0.1, borderRadius: '50%' }} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ width: '440px', padding: '48px', borderRadius: '24px', background: 'white', boxShadow: '0 20px 60px rgba(0, 102, 204, 0.15)', zIndex: 1, position: 'relative' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg, #0066CC, #0EA5E9)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Warehouse size={34} color="white" />
          </div>
          <h1 className="gradient-text" style={{ fontSize: '30px', fontWeight: 800, marginBottom: '4px' }}>VNPT WARE</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Hệ thống quản lý kho thiết bị</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Tên đăng nhập</label>
            <div style={{ position: 'relative' }}>
              <UserIcon size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Nhập tên đăng nhập..." value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: '13px 14px 13px 42px', border: '1.5px solid var(--border)', borderRadius: '12px' }} />
            </div>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <Lock size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type={showPassword ? 'text' : 'password'} placeholder="Nhập mật khẩu..." value={password} onChange={(e) => setPassword(e.target.value)} className="form-input" style={{ paddingLeft: '42px', paddingRight: '46px' }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none' }}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginBottom: '20px' }}>
            <button type="button" onClick={() => setShowForgotModal(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Quên mật khẩu?</button>
          </div>

          {error && <div style={{ marginBottom: '20px', color: 'var(--error)', fontSize: '13px', textAlign: 'center', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}

          <button type="submit" disabled={isLoading} className="btn-primary" style={{ width: '100%', padding: '15px', borderRadius: '12px', marginBottom: '16px' }}>
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Đăng nhập ngay'}
          </button>
          
          <button type="button" onClick={() => navigate('/')} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'white', color: 'var(--text-secondary)', border: '1.5px solid var(--border)', cursor: 'pointer' }}>Quay về Trang chủ</button>
        </form>
      </motion.div>

      <div style={{ position: 'absolute', bottom: '24px', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', width: '100%' }}>© 2025 VNPT IT · Hệ thống quản lý kho thiết bị</div>

      {showForgotModal && <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />}
    </div>
  );
};

export default LoginPage;
