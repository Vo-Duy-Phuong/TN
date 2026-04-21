import React, { useState, useRef, useEffect } from 'react';
import { 
  BarChart3, 
  Package, 
  Warehouse, 
  Users, 
  Wrench, 
  Settings, 
  Bell, 
  Search,
  LogOut,
  ChevronRight,
  Menu,
  Clock,
  AlertTriangle,
  Info,
  History,
  User as UserIcon,
  Shield,
  Bookmark,
  QrCode,
  ClipboardList,
  Briefcase,
  RotateCcw,
  Navigation
} from 'lucide-react';
import QRScannerModal from '../QRScannerModal';
import ProductQuickView from '../ProductQuickView';
import AIChatbot from '../ai/AIChatbot';
import { productApi } from '../../api/products';
import type { Product } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useSearch } from '../../contexts/SearchContext';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { PERMISSIONS } from '../../api/permissions';
import type { PageView } from '../../App';
import { extractProductId } from '../../utils/qrUtils';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '11px 16px',
      margin: '2px 10px',
      borderRadius: '10px',
      cursor: 'pointer',
      background: active ? 'var(--primary-light)' : 'transparent',
      color: active ? 'var(--primary)' : 'var(--text-secondary)',
      fontWeight: active ? 600 : 400,
      transition: 'all 0.2s ease',
      borderLeft: active ? '3px solid var(--primary)' : '3px solid transparent',
    }} className={active ? '' : 'sidebar-item-hover'}>
    <div style={{ flexShrink: 0 }}>{icon}</div>
    <span style={{ fontSize: '14px', flex: 1 }}>{label}</span>
    {active && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', marginLeft: 'auto' }} />}
  </div>
);

interface AppLayoutProps {
  children: React.ReactNode;
  activePage: PageView;
  onNavigate: (page: PageView) => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, activePage, onNavigate }) => {
  const { user, logout, hasPermission } = useAuth();
  const isTechnician = user?.roleCode === 'TECHNICIAN';
  const { searchQuery, setSearchQuery } = useSearch();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGlobalScannerOpen, setIsGlobalScannerOpen] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + 
           date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const getNotificationIcon = (type: number) => {
    switch (type) {
      case 0: return <Shield size={16} color="#EC4899" />;
      case 1: return <AlertTriangle size={16} color="#F59E0B" />;
      default: return <Info size={16} color="var(--primary)" />;
    }
  };

  const handleGlobalScan = async (decodedText: string) => {
    try {
      const productId = extractProductId(decodedText);

      // Validate if it's a GUID
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!guidRegex.test(productId)) {
        // If not a GUID, try searching for it (maybe it's a product name or custom code)
        const response = await productApi.getProducts({ search: productId, pageSize: 1 });
        if (response.items.length > 0) {
          setScannedProduct(response.items[0]);
          setIsQuickViewOpen(true);
        } else {
          alert('Không tìm thấy sản phẩm này trong kho. Vui lòng kiểm tra lại mã QR.');
        }
        return;
      }

      // Fetch full details directly by ID
      const product = await productApi.getProduct(productId);
      
      if (product) {
        setScannedProduct(product);
        setIsQuickViewOpen(true);
      } else {
        alert('Không tìm thấy sản phẩm này trong kho. Vui lòng kiểm tra lại mã QR.');
      }
    } catch (error) {
      console.error('Global scan failed:', error);
      alert('Không tìm thấy hoặc lỗi khi truy xuất dữ liệu sản phẩm.');
    }
  };

  return (
    <div className="app-container">
      <style>{`
        .sidebar-item-hover:hover {
          background: var(--primary-lighter);
          color: var(--primary);
        }
        .header-btn {
          position: relative;
          cursor: pointer;
          padding: 10px;
          border-radius: 10px;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          transition: all 0.2s;
          box-shadow: var(--shadow-sm);
        }
        .header-btn:hover {
          border-color: var(--primary);
          background: var(--primary-lighter);
          color: var(--primary);
        }
        .dropdown-menu {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 320px;
          background: #FFFFFF;
          backdrop-filter: blur(16px);
          border: 1px solid var(--border);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 102, 204, 0.15), 0 2px 8px rgba(0,0,0,0.08);
          z-index: 1000;
          overflow: hidden;
          animation: dropdownFade 0.2s ease-out;
        }
        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .notification-item {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          cursor: pointer;
          transition: background 0.2s;
        }
        .notification-item:hover {
          background: var(--primary-lighter);
        }
        .notification-item.unread {
          background: #EFF6FF;
          border-left: 3px solid var(--primary);
        }
        .main-content {
          flex: 1;
          height: 100vh;
          overflow-y: auto;
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .main-content.gis-mode {
          overflow: hidden !important;
        }
        .main-content-inner {
          padding: 0 40px 40px 40px;
          max-width: 1600px;
          margin: 0 auto;
          width: 100%;
        }
        .main-content-full {
          width: 100%;
          flex: 1;
          position: relative;
          overflow: hidden;
          padding: 0 !important;
          margin: 0 !important;
        }
        .menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 8px;
          margin: 2px 8px;
        }
        .menu-item:hover {
          background: var(--primary-lighter);
          color: var(--primary);
        }
        .ping {
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .search-input {
          transition: all 0.2s;
        }
        .search-input:focus {
          outline: none;
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }
      `}</style>
      
      <div className="sidebar" style={{ boxShadow: 'var(--shadow-md)', zIndex: 100 }}>
        <div 
          style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
          onClick={() => onNavigate('dashboard')}
          title="Quay về Trang chủ"
        >
          <div className="gradient-bg" style={{ padding: '10px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 102, 204, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Warehouse size={22} color="white" />
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.5px' }} className="gradient-text">VNPT WARE</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Smart Management</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '20px 20px 8px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Hệ thống chính</div>
          {hasPermission(PERMISSIONS.Dashboard.View) && (
            <SidebarItem 
              icon={<BarChart3 size={20} />} 
              label="Tổng quan" 
              active={activePage === 'dashboard'} 
              onClick={() => onNavigate('dashboard')}
            />
          )}
          {hasPermission(PERMISSIONS.Products.View) && (
            <SidebarItem 
              icon={<Package size={20} />} 
              label="Sản phẩm" 
              active={activePage === 'products'} 
              onClick={() => onNavigate('products')}
            />
          )}
          {hasPermission(PERMISSIONS.Warehouses.View) && (
            <SidebarItem 
              icon={<Warehouse size={20} />} 
              label="Kho hàng" 
              active={activePage === 'warehouses'} 
              onClick={() => onNavigate('warehouses')}
            />
          )}
          {(hasPermission(PERMISSIONS.Categories.View) || hasPermission(PERMISSIONS.Brands.View)) && (
            <SidebarItem 
              icon={<Bookmark size={20} />} 
              label="Danh mục & Brand" 
              active={activePage === 'references'} 
              onClick={() => onNavigate('references')}
            />
          )}

          <SidebarItem 
            icon={<Navigation size={20} />} 
            label="Bản đồ điều phối" 
            active={activePage === 'gis'} 
            onClick={() => onNavigate('gis')} 
          />

          <div style={{ padding: '20px 20px 8px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Dịch vụ khách hàng</div>
          {isTechnician ? (
            <SidebarItem 
              icon={<Briefcase size={20} />} 
              label="Công việc của tôi" 
              active={activePage === 'service-requests'} 
              onClick={() => onNavigate('service-requests')}
            />
          ) : (
            hasPermission(PERMISSIONS.ServiceRequests.View) && (
              <SidebarItem 
                icon={<ClipboardList size={20} />} 
                label="Yêu cầu dịch vụ" 
                active={activePage === 'service-requests'} 
                onClick={() => onNavigate('service-requests')}
              />
            )
          )}
          
          {(hasPermission(PERMISSIONS.Imports.View) || hasPermission(PERMISSIONS.Exports.View) || hasPermission(PERMISSIONS.Repairs.View)) && (
            <>
              <div style={{ padding: '20px 20px 8px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Giao dịch kho</div>
              {hasPermission(PERMISSIONS.Imports.View) && (
                <SidebarItem 
                  icon={<ChevronRight size={20} />} 
                  label="Nhập kho" 
                  active={activePage === 'imports'} 
                  onClick={() => onNavigate('imports')}
                />
              )}
              {hasPermission(PERMISSIONS.Exports.View) && (
                <SidebarItem 
                  icon={<ChevronRight size={20} />} 
                  label="Xuất kho" 
                  active={activePage === 'exports'} 
                  onClick={() => onNavigate('exports')}
                />
              )}
              {hasPermission(PERMISSIONS.Retrievals.View) && (
                <SidebarItem 
                  icon={<RotateCcw size={20} />} 
                  label="Thu hồi thiết bị" 
                  active={activePage === 'retrievals'} 
                  onClick={() => onNavigate('retrievals')}
                />
              )}
              {hasPermission(PERMISSIONS.Repairs.View) && (
                <SidebarItem 
                  icon={<Wrench size={20} />} 
                  label="Sửa chữa" 
                  active={activePage === 'repairs'} 
                  onClick={() => onNavigate('repairs')}
                />
              )}
            </>
          )}

          {user?.roleCode === 'ADMIN' && (
            <>
              <div style={{ padding: '20px 20px 8px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Quản trị viên</div>
              <SidebarItem 
                icon={<Users size={20} />} 
                label="Người dùng" 
                active={activePage === 'users'} 
                onClick={() => onNavigate('users')}
              />
              <SidebarItem 
                icon={<History size={20} />} 
                label="Lịch sử hệ thống" 
                active={activePage === 'audit'} 
                onClick={() => onNavigate('audit')}
              />
              <SidebarItem 
                icon={<Settings size={20} />} 
                label="Cài đặt" 
                active={activePage === 'settings'} 
                onClick={() => onNavigate('settings')}
              />
            </>
          )}
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid var(--border)', background: 'var(--primary-lighter)' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            padding: '14px',
            background: 'white',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.3s'
          }} className="sidebar-profile-card">
            <div className="gradient-bg" style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '15px', color: 'white', flexShrink: 0, boxShadow: '0 4px 8px rgba(0, 102, 204, 0.2)' }}>
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.fullName || 'Người dùng'}</div>
              <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{user?.roleName || 'Thành viên'}</div>
            </div>
            <div 
              style={{ padding: '8px', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: '8px', transition: 'all 0.2s' }}
              className="logout-btn-hover"
              onClick={async () => {
                await logout();
                navigate('/');
              }}
            >
              <LogOut size={18} />
            </div>
          </div>
          <style>{`
            .sidebar-profile-card:hover { border-color: var(--primary); transform: translateY(-2px); box-shadow: var(--shadow-md); }
            .logout-btn-hover:hover { background: var(--error-bg); color: var(--error) !important; }
          `}</style>
        </div>
      </div>

      <div className={`main-content ${activePage === 'gis' ? 'gis-mode' : ''}`}>
        <header style={{ 
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '20px 40px',
          background: 'rgba(240, 244, 249, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          marginBottom: '20px'
        }}>
          <div className="search-wrapper" style={{ flex: 1, maxWidth: '600px' }}>
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm sản phẩm, phiếu kho, người dùng... (Alt + S)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-field"
              style={{ background: 'white', border: '1px solid var(--border)' }}
            />
            <div 
              className="search-shortcut"
              onClick={() => setIsGlobalScannerOpen(true)}
              title="Quét mã QR tra cứu nhanh"
            >
              <QrCode size={14} />
              <span>Quét PDF/QR</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div ref={notificationRef} style={{ position: 'relative' }}>
              <div 
                className="header-btn" 
                onClick={() => {
                  setIsNotificationOpen(!isNotificationOpen);
                  setIsMenuOpen(false);
                }}
              >
                <Bell size={20} color={isNotificationOpen ? 'var(--primary)' : 'var(--text-secondary)'} />
                {unreadCount > 0 && (
                  <>
                    <div style={{ position: 'absolute', top: '10px', right: '10px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--error)', border: '2px solid var(--surface)', zIndex: 1 }} />
                    <div className="ping" style={{ position: 'absolute', top: '10px', right: '10px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--error)' }} />
                  </>
                )}
              </div>

              {isNotificationOpen && (
                <div className="dropdown-menu">
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--primary-lighter)' }}>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '15px' }}>Thông báo mới</span>
                    <button 
                      onClick={markAllAsRead}
                      className="action-btn"
                      style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 700, color: 'var(--primary)', borderColor: 'var(--primary-light)' }}
                    >
                      Đánh dấu đã đọc
                    </button>
                  </div>
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                        Không có thông báo nào
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          className={`notification-item ${!n.isRead ? 'unread' : ''}`}
                          onClick={() => {
                            if (!n.isRead) markAsRead(n.id);
                            if (n.link === '/service-requests') {
                              onNavigate('service-requests');
                              setIsNotificationOpen(false);
                            }
                          }}
                        >
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ marginTop: '2px' }}>{getNotificationIcon(n.type)}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{n.title}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{n.message}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={10} /> {formatTime(n.createdAt)}
                              </div>
                            </div>
                            {!n.isRead && (
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', marginTop: '6px', flexShrink: 0 }} />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid var(--border)', background: 'var(--primary-lighter)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Xem tất cả thông báo</span>
                  </div>
                </div>
              )}
            </div>

            <div ref={menuRef} style={{ position: 'relative' }}>
              <div 
                className="header-btn"
                onClick={() => {
                  setIsMenuOpen(!isMenuOpen);
                  setIsNotificationOpen(false);
                }}
              >
                <Menu size={20} color={isMenuOpen ? 'var(--primary)' : 'var(--text-secondary)'} />
              </div>

              {isMenuOpen && (
                <div className="dropdown-menu" style={{ width: '240px' }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--primary-lighter)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #0066CC, #0EA5E9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '16px' }}>
                      {user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>{user?.fullName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user?.roleName}</div>
                    </div>
                  </div>
                  <div style={{ padding: '8px 0' }}>
                    <div className="menu-item" onClick={() => onNavigate('settings')}>
                      <UserIcon size={18} />
                      <span style={{ fontSize: '14px' }}>Hồ sơ của tôi</span>
                    </div>
                    <div className="menu-item" onClick={() => onNavigate('settings')}>
                      <Shield size={18} />
                      <span style={{ fontSize: '14px' }}>Bảo mật</span>
                    </div>
                    <div className="menu-item" onClick={() => onNavigate('settings')}>
                      <Settings size={18} />
                      <span style={{ fontSize: '14px' }}>Cài đặt</span>
                    </div>
                    <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }} />
                    <div className="menu-item" style={{ color: 'var(--error)' }} onClick={logout}>
                      <LogOut size={18} />
                      <span style={{ fontSize: '14px' }}>Đăng xuất</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className={activePage === 'gis' ? 'main-content-full' : 'main-content-inner'}>
          <main style={{ 
            flex: 1, 
            position: 'relative', 
            width: '100%',
            height: activePage === 'gis' ? 'calc(100vh - 84px)' : 'auto',
            display: 'block',
            overflow: activePage === 'gis' ? 'hidden' : 'visible'
          }}>
            {children}
            {!children && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'gray' }}>
                No child component rendered.
              </div>
            )}
          </main>
        </div>
      </div>

      <QRScannerModal 
        isOpen={isGlobalScannerOpen} 
        onClose={() => setIsGlobalScannerOpen(false)} 
        onScanSuccess={handleGlobalScan} 
      />

      <ProductQuickView 
        isOpen={isQuickViewOpen} 
        onClose={() => {
          setIsQuickViewOpen(false);
          setScannedProduct(null);
        }} 
        product={scannedProduct} 
      />

      {user?.roleCode === 'ADMIN' && <AIChatbot activePage={activePage} />}
    </div>
  );
};

export default AppLayout;
