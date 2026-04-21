import React, { useState } from 'react';
import { 
  Zap, 
  CheckCircle, 
  ArrowRight, 
  Star, 
  Shield,
  Lock,
  Search,
  Loader2,
  AlertCircle,
  FileText,
  Calendar,
  Activity,
  Home,
  ChevronRight,
  Monitor,
  Smartphone as PhoneIcon,
  Globe,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useNavigate } from 'react-router-dom';
import { equipmentApi } from '../api/individualEquipment';
import { serviceRequestApi } from '../api/serviceRequests';
import type { EquipmentPublicLookupDto } from '../api/individualEquipment';
import { format } from 'date-fns';

type ViewType = 'HOME' | 'SERVICES' | 'REGISTER' | 'LOOKUP';

const CustomerPortal: React.FC = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<ViewType>('HOME');
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<EquipmentPublicLookupDto | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    selectedPackage: '',
    serviceType: 'Lắp đặt mới',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const services = [
    { id: 'internet', title: 'Internet Cáp Quang', icon: <Zap size={32} />, desc: 'Tốc độ lên đến 1Gbps, ổn định tuyệt đối cho học tập và làm việc.' },
    { id: 'tv', title: 'Truyền hình MyTV', icon: <Zap size={32} />, desc: 'Hơn 200 kênh đặc sắc, chất lượng 4K và kho phim khổng lồ.' },
    { id: 'mobile', title: 'Di động VinaPhone', icon: <Zap size={32} />, desc: 'Mạng 5G siêu tốc, gói cước linh hoạt, ưu đãi data khủng.' },
    { id: 'solutions', title: 'Giải pháp Doanh nghiệp', icon: <Zap size={32} />, desc: 'Cloud, Bảo mật, Chữ ký số và các giải pháp chuyển đổi số.' }
  ];

  const servicePackages = [
    { id: 'home1', name: 'Home Mesh 1', speed: '100 Mbps', price: '165.000đ/tháng', color: '#0066CC', features: ['WiFi 5 chuẩn AC', 'Hỗ trợ 24/7', 'Lắp đặt 24h'] },
    { id: 'home2', name: 'Home Mesh 2', speed: '150 Mbps', price: '180.000đ/tháng', color: '#00A3FF', features: ['WiFi 5 Dual Band', 'Tặng 1 Mesh WiFi', 'Ưu tiên Youtube'], highlight: true },
    { id: 'home3', name: 'Home Mesh 3', speed: '200 Mbps', price: '210.000đ/tháng', color: '#7c3aed', features: ['WiFi 6 thế hệ mới', 'Tặng 2 Mesh WiFi', 'IP Tĩnh'] },
    { id: 'home7', name: 'Home Mesh 7', speed: '1000 Mbps', price: '350.000đ/tháng', color: '#f59e0b', features: ['Tốc độ 1Gbps', 'Full thiết bị WiFi 6', 'Ưu tiên Game'] }
  ];

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;

    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const result = await equipmentApi.lookup(lookupQuery.trim());
      setLookupResult(result);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setLookupError('Không tìm thấy thiết bị với mã Serial/MAC này. Vui lòng kiểm tra lại.');
      } else {
        setLookupError('Có lỗi xảy ra khi tra cứu. Vui lòng thử lại sau.');
      }
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        customerName: formData.fullName,
        phoneNumber: formData.phone,
        address: `${formData.address}, Đồng Tháp`,
        selectedPackage: formData.selectedPackage,
        description: formData.description,
        serviceType: formData.serviceType
      };

      await serviceRequestApi.create(payload);
      
      alert('Cảm ơn bạn đã quan tâm! VNPT sẽ liên hệ với bạn trong vòng 30 phút.');
      setFormData({ fullName: '', phone: '', address: '', selectedPackage: '', serviceType: 'Lắp đặt mới', description: '' });
    } catch (error) {
      console.error('Registration error:', error);
      alert('Có lỗi xảy ra khi gửi đăng ký. Vui lòng thử lại sau hoặc liên hệ tổng đài 1800.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderHome = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <section className="hero-section" style={{ background: 'linear-gradient(135deg, #0066CC 0%, #00A3FF 100%)', color: 'white', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: 0.2 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(5px)', marginBottom: '24px', fontSize: '14px', fontWeight: 600 }}
          >
            <Star size={16} fill="white" /> VNPT - Kết nối mọi giá trị
          </motion.div>
          <h1 className="hero-title">Trải nghiệm dịch vụ số đỉnh cao cùng VNPT</h1>
          <p style={{ fontSize: '20px', opacity: 0.9, marginBottom: '40px', maxWidth: '700px', margin: '0 auto 40px' }}>
            Chào mừng bạn đến với cổng thông tin khách hàng VNPT Connect. Khám phá hệ sinh thái dịch vụ viễn thông và công nghệ hàng đầu Việt Nam.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button onClick={() => setActiveView('REGISTER')} style={{ padding: '16px 40px', borderRadius: '12px', background: 'white', color: '#0066CC', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>Bắt đầu ngay</button>
            <button onClick={() => setActiveView('SERVICES')} style={{ padding: '16px 40px', borderRadius: '12px', border: '2px solid white', background: 'transparent', color: 'white', fontWeight: 800, cursor: 'pointer' }}>Xem các dịch vụ</button>
          </div>
        </div>
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }}></div>
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }}></div>
      </section>

      <section style={{ padding: '0 40px 100px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="responsive-grid-3">
            <div className="card" style={{ padding: '40px', borderRadius: '32px', cursor: 'pointer', border: '1px solid #f1f5f9' }} onClick={() => setActiveView('SERVICES')}>
              <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <Monitor size={32} />
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>Hệ sinh thái dịch vụ</h3>
              <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>Khám phá các gói cước Internet, Truyền hình và Di động phù hợp với nhu cầu của bạn.</p>
              <div style={{ color: '#0066CC', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Xem chi tiết <ChevronRight size={18} />
              </div>
            </div>

            <div className="card" style={{ padding: '40px', borderRadius: '32px', cursor: 'pointer', border: '1px solid #f1f5f9' }} onClick={() => setActiveView('REGISTER')}>
              <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <Zap size={32} />
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>Đăng ký lắp đặt</h3>
              <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>Đăng ký nhanh chóng chỉ trong 30 giây. Hỗ trợ lắp đặt siêu tốc trong vòng 24h.</p>
              <div style={{ color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Đăng ký ngay <ChevronRight size={18} />
              </div>
            </div>

            <div className="card" style={{ padding: '40px', borderRadius: '32px', cursor: 'pointer', border: '1px solid #f1f5f9' }} onClick={() => setActiveView('LOOKUP')}>
              <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <Search size={32} />
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>Tra cứu thiết bị</h3>
              <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>Kiểm tra tình trạng thiết bị, thời gian bảo hành và tải hướng dẫn sử dụng nhanh.</p>
              <div style={{ color: '#d97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Tra cứu ngay <ChevronRight size={18} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );

  const renderServices = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
    >
      <section style={{ padding: '100px 40px', background: '#f8fafc', minHeight: '80vh' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#1e293b', marginBottom: '16px' }}>Dịch vụ của chúng tôi</h2>
            <p style={{ color: '#64748b', fontSize: '18px' }}>Lựa chọn gói dịch vụ phù hợp nhất với nhu cầu của bạn</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '80px' }}>
            {services.map(s => (
              <div key={s.id} className="card" style={{ padding: '32px', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(0,102,204,0.1)', color: '#0066CC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  {s.icon}
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: '#1e293b' }}>{s.title}</h3>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button onClick={() => setActiveView('REGISTER')} className="btn-primary" style={{ padding: '16px 48px', borderRadius: '16px', fontWeight: 800 }}>Đăng ký ngay hôm nay</button>
          </div>
        </div>
      </section>
    </motion.div>
  );

  const renderLookup = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
    >
      <section style={{ padding: '100px 40px', background: 'white', minHeight: '80vh' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className="gradient-text" style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>Tính năng mới</div>
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#1e293b', marginBottom: '16px' }}>Tra cứu thiết bị VNPT</h2>
            <p style={{ color: '#64748b', fontSize: '18px' }}>Kiểm tra tình trạng, thời hạn bảo hành và tải bộ hướng dẫn sử dụng nhanh</p>
          </div>

          <div className="card" style={{ padding: '40px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)', borderRadius: '32px', border: '1px solid #e2e8f0' }}>
            <form onSubmit={handleLookup} style={{ display: 'flex', gap: '12px', marginBottom: lookupResult || lookupError ? '32px' : '0' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  placeholder="Nhập Serial Number hoặc mã MAC của thiết bị..." 
                  className="form-input"
                  style={{ paddingLeft: '48px', height: '56px', borderRadius: '16px', fontSize: '16px' }}
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                />
              </div>
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ height: '56px', padding: '0 32px', borderRadius: '16px', fontWeight: 700 }}
                disabled={lookupLoading}
              >
                {lookupLoading ? <Loader2 className="animate-spin" /> : 'Tra cứu'}
              </button>
            </form>

            {lookupError && (
              <div className="animate-shake" style={{ display: 'flex', gap: '12px', padding: '16px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', color: '#dc2626', alignItems: 'center' }}>
                <AlertCircle size={20} />
                <span style={{ fontWeight: 600 }}>{lookupError}</span>
              </div>
            )}

            {lookupResult && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ paddingBottom: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0066CC', textTransform: 'uppercase', marginBottom: '4px' }}>{lookupResult.productCategory || 'Thiết bị'}</div>
                    <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b' }}>{lookupResult.productName}</h3>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                      <span style={{ fontSize: '14px', color: '#64748b' }}>S/N: <strong>{lookupResult.serialNumber}</strong></span>
                      <span style={{ fontSize: '14px', color: '#64748b' }}>MAC: <strong>{lookupResult.macAddress}</strong></span>
                    </div>
                  </div>
                  <div style={{ 
                    padding: '8px 16px', 
                    borderRadius: '30px', 
                    background: lookupResult.isActive ? '#dcfce7' : '#f1f5f9', 
                    color: lookupResult.isActive ? '#16a34a' : '#64748b',
                    fontSize: '14px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Activity size={16} /> {lookupResult.statusLabel}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '20px' }}>
                  <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#0066CC', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={18} />
                      </div>
                      <span style={{ fontWeight: 700, color: '#334155' }}>Thông tin bảo hành</span>
                    </div>
                    {lookupResult.warrantyExpiry ? (
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: lookupResult.isUnderWarranty ? '#16a34a' : '#ef4444' }}>
                          {lookupResult.isUnderWarranty ? 'Còn bảo hành' : 'Hết hạn bảo hành'}
                        </div>
                        <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                          <Calendar size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                          Hạn bảo hành: {format(new Date(lookupResult.warrantyExpiry), 'dd/MM/yyyy')}
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: '#94a3b8', fontSize: '14px', fontStyle: 'italic' }}>Không rõ thông tin bảo hành</div>
                    )}
                  </div>

                  <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#7c3aed', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={18} />
                      </div>
                      <span style={{ fontWeight: 700, color: '#334155' }}>Hướng dẫn sử dụng</span>
                    </div>
                    {lookupResult.eManualUrl ? (
                      <a 
                        href={lookupResult.eManualUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-primary"
                        style={{ background: '#7c3aed', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '14px', borderRadius: '10px', textDecoration: 'none' }}
                      >
                        Tải E-Manual (PDF) <ArrowRight size={14} />
                      </a>
                    ) : (
                      <div style={{ color: '#94a3b8', fontSize: '14px', fontStyle: 'italic' }}>Tài liệu đang được cập nhật</div>
                    )}
                  </div>
                </div>

                {lookupResult.installationDate && (
                  <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
                    Ngày kích hoạt thiết bị: {format(new Date(lookupResult.installationDate), 'dd/MM/yyyy HH:mm')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </motion.div>
  );

  const renderRegister = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
    >
      <section style={{ padding: '100px 40px', background: 'white', minHeight: '80vh' }}>
        <div className="responsive-grid-2" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div>
            <h2 style={{ fontSize: '40px', fontWeight: 800, color: '#1e293b', marginBottom: '24px' }}>Sẵn sàng nâng cấp không gian số của bạn?</h2>
            <p style={{ color: '#64748b', fontSize: '18px', marginBottom: '40px', lineHeight: 1.6 }}>Điền thông tin và VNPT sẽ liên hệ để tư vấn và lắp đặt tại nhà cho bạn ngay trong ngày.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ color: '#22c55e' }}><CheckCircle size={24} /></div>
                <div>
                  <h4 style={{ fontWeight: 700, marginBottom: '4px' }}>Hỗ trợ 24/7</h4>
                  <p style={{ fontSize: '14px', color: '#64748b' }}>Đội ngũ CSKH luôn sẵn sàng giải đáp mọi thắc mắc.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ color: '#22c55e' }}><CheckCircle size={24} /></div>
                <div>
                  <h4 style={{ fontWeight: 700, marginBottom: '4px' }}>Lắp đặt siêu tốc</h4>
                  <p style={{ fontSize: '14px', color: '#64748b' }}>Cam kết hoàn thành trong vòng 24 giờ đăng ký.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ color: '#22c55e' }}><CheckCircle size={24} /></div>
                <div>
                  <h4 style={{ fontWeight: 700, marginBottom: '4px' }}>Công nghệ tiên phong</h4>
                  <p style={{ fontSize: '14px', color: '#64748b' }}>Hệ thống hạ tầng hiện đại bậc nhất Việt Nam.</p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '48px', padding: '24px', background: '#f1f5f9', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#0066CC', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 900 }}>
                1800
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Tổng đài hỗ trợ</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#1e293b' }}>1800 1166</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '40px', border: '1px solid #e2e8f0', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.08)' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 800, color: '#0066CC', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1px', marginBottom: '12px', display: 'block' }}>Bước 1: Chọn loại yêu cầu của bạn</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { id: 'Lắp đặt mới', label: 'Lắp đặt mới', icon: <Zap size={18} />, color: '#0066CC' },
                    { id: 'Báo hỏng / Sửa chữa', label: 'Báo hỏng', icon: <Activity size={18} />, color: '#ef4444' },
                    { id: 'Hỗ trợ kỹ thuật', label: 'Hỗ trợ kỹ thuật', icon: <Briefcase size={18} />, color: '#7c3aed' },
                    { id: 'Yêu cầu khác', label: 'Yêu cầu khác', icon: <FileText size={18} />, color: '#64748b' }
                  ].map(type => (
                    <div
                      key={type.id}
                      onClick={() => setFormData({ ...formData, serviceType: type.id })}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '16px',
                        border: `2px solid ${formData.serviceType === type.id ? type.color : '#f1f5f9'}`,
                        background: formData.serviceType === type.id ? `${type.color}10` : 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.2s',
                        fontWeight: 700,
                        fontSize: '13px',
                        color: formData.serviceType === type.id ? type.color : '#64748b'
                      }}
                    >
                      <div style={{ opacity: formData.serviceType === type.id ? 1 : 0.5 }}>{type.icon}</div>
                      {type.label}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 800, color: '#0066CC', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1px', marginBottom: '12px', display: 'block' }}>Bước 2: Thông tin liên hệ</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'block' }}>Họ và tên khách hàng</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Nguyễn Văn A"
                      className="form-input"
                      style={{ borderRadius: '12px' }}
                      required
                      value={formData.fullName}
                      onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'block' }}>Số điện thoại</label>
                      <input
                        type="text"
                        placeholder="0912xxxxxx"
                        className="form-input"
                        style={{ borderRadius: '12px' }}
                        required
                        maxLength={10}
                        value={formData.phone}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 10) {
                            setFormData({ ...formData, phone: val });
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'block' }}>Tỉnh/Thành phố</label>
                      <select className="form-input" style={{ borderRadius: '12px' }} defaultValue="DT" disabled>
                        <option value="DT">Đồng Tháp</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'block' }}>Địa chỉ lắp đặt chi tiết</label>
                    <input
                      type="text"
                      placeholder="Số nhà, tên đường, phường/xã..."
                      className="form-input"
                      style={{ borderRadius: '12px' }}
                      required
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {formData.serviceType === 'Lắp đặt mới' && (
                <div className="animate-fade-in">
                  <label className="form-label" style={{ fontWeight: 800, color: '#0066CC', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1px', marginBottom: '12px', display: 'block' }}>BƯỚC 3: Chọn gói dịch vụ (Nếu có)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '10px' }}>
                  {servicePackages.map(pkg => (
                    <div
                      key={pkg.id}
                      onClick={() => setFormData({ ...formData, selectedPackage: formData.selectedPackage === pkg.id ? '' : pkg.id })}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: `2px solid ${formData.selectedPackage === pkg.id ? pkg.color : '#e2e8f0'}`,
                        background: formData.selectedPackage === pkg.id ? `${pkg.color}10` : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative'
                      }}
                    >
                      {pkg.highlight && (
                        <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: pkg.color, color: 'white', fontSize: '10px', fontWeight: 700, padding: '2px 10px', borderRadius: '10px', whiteSpace: 'nowrap' }}>Phổ Biến Nhất</div>
                      )}
                      <div style={{ fontWeight: 800, fontSize: '14px', color: pkg.color, marginBottom: '4px' }}>{pkg.name}</div>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#1e293b', marginBottom: '2px' }}>{pkg.speed}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{pkg.price}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

              <div>
                <label className="form-label" style={{ fontWeight: 800, color: '#0066CC', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1px', marginBottom: '6px', display: 'block' }}>Ghi chú bổ sung</label>
                <textarea
                  placeholder="Mô tả cụ thể yêu cầu của bạn (ví dụ: mất mạng từ sáng, cần lắp gấp...)"
                  className="form-input"
                  rows={2}
                  style={{ borderRadius: '12px', resize: 'none', padding: '12px' }}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
                style={{ borderRadius: '12px', padding: '16px', fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '12px' }}
              >
                {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : <>Gửi thông tin đăng ký <ArrowRight size={20} /></>}
              </button>
            </form>
          </div>
        </div>
      </section>
    </motion.div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'white', overflowX: 'hidden' }}>
      {/* Navigation */}
      <nav className="responsive-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveView('HOME')}>
          <div style={{ width: '40px', height: '40px', background: '#0066CC', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap color="white" fill="white" size={24} />
          </div>
          <span className="logo-text" style={{ fontWeight: 900, color: '#0066CC', letterSpacing: '-1px' }}>VNPT <span style={{ color: '#1e293b' }}>Connect</span></span>
        </div>
        <div className="nav-links">
          <button onClick={() => setActiveView('HOME')} style={{ fontWeight: 700, color: activeView === 'HOME' ? '#0066CC' : '#475569', background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
            Trang chủ
            {activeView === 'HOME' && <motion.div layoutId="activeNav" style={{ position: 'absolute', bottom: '-28px', left: 0, right: 0, height: '4px', background: '#0066CC', borderRadius: '4px' }} />}
          </button>
          <button onClick={() => setActiveView('SERVICES')} style={{ fontWeight: 700, color: activeView === 'SERVICES' ? '#0066CC' : '#475569', background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
            Dịch vụ
            {activeView === 'SERVICES' && <motion.div layoutId="activeNav" style={{ position: 'absolute', bottom: '-28px', left: 0, right: 0, height: '4px', background: '#0066CC', borderRadius: '4px' }} />}
          </button>
          <button onClick={() => setActiveView('LOOKUP')} style={{ fontWeight: 700, color: activeView === 'LOOKUP' ? '#0066CC' : '#475569', background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
            Tra cứu
            {activeView === 'LOOKUP' && <motion.div layoutId="activeNav" style={{ position: 'absolute', bottom: '-28px', left: 0, right: 0, height: '4px', background: '#0066CC', borderRadius: '4px' }} />}
          </button>
          <button onClick={() => setActiveView('REGISTER')} style={{ fontWeight: 700, color: activeView === 'REGISTER' ? '#0066CC' : '#475569', background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
            Đăng ký
            {activeView === 'REGISTER' && <motion.div layoutId="activeNav" style={{ position: 'absolute', bottom: '-28px', left: 0, right: 0, height: '4px', background: '#0066CC', borderRadius: '4px' }} />}
          </button>
          <button
            onClick={() => navigate('/login')}
            className="staff-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '20px', background: '#f1f5f9', border: 'none', fontWeight: 600, color: '#64748b', cursor: 'pointer', marginLeft: '16px' }}
          >
            <Lock size={16} /> <span className="staff-btn-text">Nhân viên VNPT</span>
          </button>
        </div>
      </nav>

      <main style={{ minHeight: 'calc(100vh - 400px)' }}>
        <AnimatePresence mode="wait">
          {activeView === 'HOME' && renderHome()}
          {activeView === 'SERVICES' && renderServices()}
          {activeView === 'LOOKUP' && renderLookup()}
          {activeView === 'REGISTER' && renderRegister()}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer style={{ background: '#1e293b', color: 'white', padding: '80px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <Zap size={32} />
            <span style={{ fontSize: '32px', fontWeight: 900 }}>VNPT Connect</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '40px', flexWrap: 'wrap' }}>
            <a href="#" style={{ color: 'white', textDecoration: 'none', opacity: 0.7 }}>Trang chủ</a>
            <a href="#services" style={{ color: 'white', textDecoration: 'none', opacity: 0.7 }}>Sản phẩm</a>
            <a href="#" style={{ color: 'white', textDecoration: 'none', opacity: 0.7 }}>Tin tức</a>
            <a href="#" style={{ color: 'white', textDecoration: 'none', opacity: 0.7 }}>Chính sách bảo mật</a>
            <a href="#" style={{ color: 'white', textDecoration: 'none', opacity: 0.7 }}>Liên hệ</a>
          </div>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', marginBottom: '40px' }}></div>
          <p style={{ opacity: 0.5, fontSize: '14px' }}>© 2026 Tập đoàn Bưu chính Viễn thông Việt Nam (VNPT). All rights reserved.</p>
        </div>
      </footer>

      <style>{`
        .gradient-text {
          background: linear-gradient(135deg, #0066CC 0%, #00A3FF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }

        /* Responsive Styles */
        .responsive-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }
        .responsive-grid-2 {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
          gap: 60px;
          align-items: center;
        }
        .responsive-nav {
          padding: 20px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(10px);
          zIndex: 100;
          border-bottom: 1px solid #f1f5f9;
        }
        .hero-title {
          font-size: 64px;
          font-weight: 900;
          margin-bottom: 24px;
          line-height: 1.1;
          letter-spacing: -2px;
        }
        .hero-section {
          padding: 80px 40px;
          border-radius: 0 0 40px 40px;
          margin-bottom: 60px;
        }
        .nav-links {
          display: flex;
          gap: 32px;
          align-items: center;
        }

        @media (max-width: 768px) {
          .responsive-grid-3, .responsive-grid-2 {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .responsive-nav {
            padding: 12px 20px !important;
            flex-direction: column !important;
            gap: 12px !important;
          }
          .nav-links {
            gap: 16px !important;
            width: 100% !important;
            justify-content: center !important;
            font-size: 13px !important;
          }
          .nav-links button span {
            display: none; /* Hide text on mobile nav if needed */
          }
          .hero-title {
            font-size: 32px !important;
          }
          .hero-section {
            padding: 60px 20px !important;
            border-radius: 0 0 20px 20px !important;
            margin-bottom: 40px !important;
          }
          .staff-btn {
            display: none !important; /* Hide staff button on mobile web for cleaner look */
          }
          .logo-text {
            font-size: 20px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomerPortal;
