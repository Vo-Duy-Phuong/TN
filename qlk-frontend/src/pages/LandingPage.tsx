import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  Globe, 
  Warehouse,
  LayoutDashboard,
  CheckCircle2
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%', 
      background: '#f8fafc',
      fontFamily: 'Inter, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Ornaments */}
      <div style={{ 
        position: 'absolute', 
        top: '-10%', 
        right: '-5%', 
        width: '600px', 
        height: '600px', 
        borderRadius: '50%', 
        background: 'radial-gradient(circle, rgba(0, 102, 204, 0.05) 0%, transparent 70%)',
        zIndex: 0
      }} />
      <div style={{ 
        position: 'absolute', 
        bottom: '-10%', 
        left: '-5%', 
        width: '500px', 
        height: '500px', 
        borderRadius: '50%', 
        background: 'radial-gradient(circle, rgba(14, 165, 233, 0.05) 0%, transparent 70%)',
        zIndex: 0
      }} />

      {/* Header */}
      <header style={{ 
        padding: '32px 5%', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        zIndex: 10 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            background: 'linear-gradient(135deg, #0066CC, #0EA5E9)', 
            borderRadius: '14px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(0, 102, 204, 0.2)'
          }}>
            <Warehouse size={28} color="white" />
          </div>
          <span style={{ 
            fontSize: '28px', 
            fontWeight: 900, 
            letterSpacing: '-1px', 
            background: 'linear-gradient(135deg, #1e293b, #334155)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>VNPT SMART WARE</span>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '0 20px 80px',
        zIndex: 10
      }}>
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          style={{ textAlign: 'center', maxWidth: '1000px', width: '100%' }}
        >
          <motion.h1 
            variants={itemVariants}
            style={{ 
              fontSize: 'clamp(32px, 5vw, 56px)', 
              fontWeight: 900, 
              color: '#1e293b', 
              marginBottom: '16px',
              lineHeight: 1.1,
              letterSpacing: '-2px'
            }}
          >
            Chào mừng đến với Hệ thống <br/>
            <span style={{ color: '#0066CC' }}>Quản lý Kho & Dịch vụ Số</span>
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            style={{ 
              fontSize: 'clamp(16px, 2vw, 19px)', 
              color: '#64748b', 
              marginBottom: '56px',
              maxWidth: '700px',
              margin: '0 auto 56px',
              lineHeight: 1.6
            }}
          >
            Giải pháp toàn diện tối ưu hóa quy trình vận hành kho thiết bị và kết nối trực tiếp khách hàng với các dịch vụ viễn thông hàng đầu của VNPT.
          </motion.p>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '32px',
            width: '100%',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            {/* Customer Portal Card */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              style={{ 
                background: 'white', 
                borderRadius: '32px', 
                padding: '40px 32px', 
                boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              className="portal-card"
            >
              <div style={{ 
                width: '64px', 
                height: '64px', 
                background: '#f0f9ff', 
                borderRadius: '20px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#0066CC',
                marginBottom: '24px',
                transition: 'all 0.3s ease'
              }} className="icon-box">
                <Globe size={32} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>Cổng Khách hàng</h2>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ background: '#f1f5f9', padding: '2px 10px', borderRadius: '20px', fontFamily: 'monospace' }}>/customer</span>
              </div>
              <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.6, marginBottom: '28px', flex: 1 }}>
                Đăng ký lắp đặt Internet, Truyền hình, Di động và hỗ trợ kỹ thuật nhanh chóng ngay tại trung tâm dịch vụ khách hàng.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate('/customer'); }}
                  style={{ 
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '13px 16px', borderRadius: '14px',
                    background: '#0066CC', color: 'white',
                    border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="portal-btn-primary"
                >
                  Mở trang <ArrowRight size={16} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); window.open('/customer', '_blank'); }}
                  title="Mở trong cửa sổ mới"
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '13px 16px', borderRadius: '14px',
                    background: '#f0f9ff', color: '#0066CC',
                    border: '1.5px solid #bfdbfe', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                    transition: 'all 0.2s', whiteSpace: 'nowrap'
                  }}
                  className="portal-btn-new-window"
                >
                  <Users size={15} /> Cửa sổ mới
                </button>
              </div>

              {/* Decorative accent */}
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                right: 0, 
                width: '100px', 
                height: '100px', 
                background: 'linear-gradient(135deg, transparent, rgba(0, 102, 204, 0.03))',
                borderRadius: '0 0 0 100%'
              }} />
            </motion.div>

            {/* Admin Portal Card */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              style={{ 
                background: 'linear-gradient(135deg, #1e293b, #0f172a)', 
                borderRadius: '32px', 
                padding: '40px 32px', 
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                color: 'white'
              }}
              className="portal-card-dark"
            >
              <div style={{ 
                width: '64px', 
                height: '64px', 
                background: 'rgba(255,255,255,0.1)', 
                borderRadius: '20px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#38bdf8',
                marginBottom: '24px',
                transition: 'all 0.3s ease'
              }} className="icon-box">
                <ShieldCheck size={32} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>Hệ thống Quản trị</h2>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 10px', borderRadius: '20px', fontFamily: 'monospace' }}>/admin/dashboard</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', lineHeight: 1.6, marginBottom: '28px', flex: 1 }}>
                Dành cho nhân viên VNPT quản lý kho hàng, thiết bị, điều phối yêu cầu kỹ thuật và theo dõi thống kê hệ thống.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate('/admin/dashboard'); }}
                  style={{ 
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '13px 16px', borderRadius: '14px',
                    background: '#38bdf8', color: '#0f172a',
                    border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="portal-btn-admin"
                >
                  Đăng nhập <ArrowRight size={16} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); window.open('/admin/dashboard', '_blank'); }}
                  title="Mở trong cửa sổ mới"
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '13px 16px', borderRadius: '14px',
                    background: 'rgba(255,255,255,0.08)', color: '#94a3b8',
                    border: '1.5px solid rgba(255,255,255,0.12)', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                    transition: 'all 0.2s', whiteSpace: 'nowrap'
                  }}
                  className="portal-btn-new-window-dark"
                >
                  <LayoutDashboard size={15} /> Cửa sổ mới
                </button>
              </div>

              {/* Decorative accent */}
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                right: 0, 
                width: '100px', 
                height: '100px', 
                background: 'linear-gradient(135deg, transparent, rgba(255,255,255,0.05))',
                borderRadius: '0 0 0 100%'
              }} />
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer style={{ 
        padding: '32px', 
        textAlign: 'center', 
        color: '#94a3b8', 
        fontSize: '13px',
        borderTop: '1px solid #f1f5f9',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="#10b981" /> Bảo mật & Tin cậy</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="#10b981" /> Hỗ trợ 24/7</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="#10b981" /> Kết nối Siêu tốc</div>
        </div>
        © 2026 Tập đoàn Bưu chính Viễn thông Việt Nam (VNPT). All rights reserved.
      </footer>

      <style>{`
        .portal-card:hover {
          border-color: #0066CC;
          box-shadow: 0 30px 60px rgba(0, 102, 204, 0.12);
        }
        .portal-card:hover .icon-box {
          background: #0066CC;
          color: white;
          transform: scale(1.1);
        }
        .portal-card-dark:hover .icon-box {
          background: #38bdf8;
          color: #0f172a;
          transform: scale(1.1);
        }
        .portal-btn-primary:hover {
          background: #0052a3 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,102,204,0.4);
        }
        .portal-btn-admin:hover {
          background: #7dd3fc !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(56,189,248,0.4);
        }
        .portal-btn-new-window:hover {
          background: #dbeafe !important;
          border-color: #93c5fd !important;
        }
        .portal-btn-new-window-dark:hover {
          background: rgba(255,255,255,0.15) !important;
          color: white !important;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
