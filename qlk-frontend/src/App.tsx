import React from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProductListPage from './pages/ProductListPage'
import ImportPage from './pages/ImportPage'
import ExportPage from './pages/ExportPage'
import RepairPage from './pages/RepairPage'
import UserPage from './pages/UserPage'
import WarehousePage from './pages/WarehousePage'
import SettingsPage from './pages/SettingsPage'
import ReferencePage from './pages/ReferencePage'
import AuditLogPage from './pages/AuditLogPage'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import ServiceRequestPage from './pages/ServiceRequestPage'
import RetrievalPage from './pages/RetrievalPage'
import CustomerPortal from './pages/CustomerPortal'
import LandingPage from './pages/LandingPage'
import PublicProductView from './pages/PublicProductView'
import AppLayout from './components/layout/AppLayout'
import { SearchProvider } from './contexts/SearchContext'
import InventoryHeatmapPage from './pages/admin/InventoryHeatmapPage'

export type PageView = 'dashboard' | 'products' | 'warehouses' | 'imports' | 'exports' | 'retrievals' | 'repairs' | 'users' | 'settings' | 'references' | 'audit' | 'service-requests' | 'gis';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
        <div className="loader">Đang kiểm tra quyền truy cập...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
        <div className="loader" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--primary-light)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
          <div style={{ fontWeight: 600 }}>Đang tải hệ thống...</div>
        </div>
      </div>
    )
  }

  return (
    <NotificationProvider>
      <Routes>
        {/* LANDING PAGE: Trang chọn lối vào */}
        <Route path="/" element={<LandingPage />} />

        {/* PUBLIC: Cổng thông tin khách hàng */}
        <Route path="/customer" element={<CustomerPortal />} />

        {/* PUBLIC: Mã QR sản phẩm */}
        <Route path="/p/:id" element={<PublicProductView />} />

        {/* PUBLIC: Đăng nhập */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/admin/dashboard" /> : <LoginPage />} />

        {/* PROTECTED: Hệ thống quản trị (Admin) */}
        <Route path="/admin/*" element={
          <ProtectedRoute>
            <AppLayoutWrapper />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </NotificationProvider>
  )
}

// Wrapper to map AppLayout navigation to react-router
const AppLayoutWrapper = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Map URL path to PageView for AppLayout active state
  const getActivePage = (): PageView => {
    const path = location.pathname.split('/').pop() || 'dashboard';
    return path as PageView;
  };

  const handleNavigate = (page: PageView) => {
    navigate(`/admin/${page}`);
  };

  return (
    <AppLayout activePage={getActivePage()} onNavigate={handleNavigate}>
      <Routes>
        <Route path="dashboard" element={<DashboardPage onNavigate={handleNavigate} />} />
        <Route path="products" element={<ProductListPage />} />
        <Route path="service-requests" element={<ServiceRequestPage />} />
        <Route path="imports" element={<ImportPage onBack={() => handleNavigate('dashboard')} />} />
        <Route path="exports" element={<ExportPage onBack={() => handleNavigate('dashboard')} />} />
        <Route path="retrievals" element={<RetrievalPage onBack={() => handleNavigate('dashboard')} />} />
        <Route path="repairs" element={<RepairPage onBack={() => handleNavigate('dashboard')} />} />
        <Route path="warehouses" element={<WarehousePage />} />
        <Route path="users" element={<UserPage />} />
        <Route path="audit" element={<AuditLogPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="references" element={<ReferencePage />} />
        <Route path="gis" element={<InventoryHeatmapPage />} />
        {/* Default admin redirect */}
        <Route path="" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SearchProvider>
          <AppContent />
        </SearchProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

// Simple Error Boundary
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', color: 'var(--text-primary)', padding: '20px', textAlign: 'center' }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', padding: '40px' }}>
            <h1 style={{ color: 'var(--error)', marginBottom: '16px' }}>Đã xảy ra lỗi hệ thống</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Hệ thống gặp sự cố không mong muốn. Vui lòng thử tải lại trang hoặc liên hệ quản trị viên.</p>
            <pre style={{ background: 'var(--primary-lighter)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '24px', textAlign: 'left', fontSize: '12px', overflowX: 'auto' }}>
              {this.state.error?.toString()}
            </pre>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary"
              style={{ padding: '12px 32px' }}
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default App
