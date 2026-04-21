import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Package, 
  ArrowLeft, 
  Info, 
  Tag, 
  Layers, 
  Loader2, 
  AlertCircle,
  Activity,
  DollarSign
} from 'lucide-react';
import axios from 'axios';
import type { Product } from '../types';

const PublicProductView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const apiBaseUrl = `http://${window.location.hostname}:5020`;
        const response = await axios.get(`${apiBaseUrl}/api/Products/public/${id}`);
        setProduct(response.data);
      } catch (err) {
        console.error('Failed to fetch public product:', err);
        setError('Không tìm thấy thông tin sản phẩm hoặc mã QR không hợp lệ.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const apiHost = window.location.hostname;
    return `http://${apiHost}:5020${path}`;
  };

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <Loader2 className="animate-spin" size={48} color="#0066CC" />
        <p style={{ marginTop: '16px', color: '#64748b', fontWeight: 600 }}>Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ minHeight: '100vh', padding: '40px 20px', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          <AlertCircle size={40} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, textAlign: 'center', marginBottom: '12px' }}>Oops!</h2>
        <p style={{ color: '#64748b', textAlign: 'center', marginBottom: '32px', maxWidth: '300px' }}>{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="btn-primary"
          style={{ padding: '12px 32px', borderRadius: '12px' }}
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '40px', fontFamily: 'Inter, sans-serif' }}>
      {/* Header Bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#1e293b', cursor: 'pointer', padding: '4px' }}>
          <ArrowLeft size={24} />
        </button>
        <span style={{ fontWeight: 800, fontSize: '18px', color: '#1e293b' }}>Chi tiết sản phẩm</span>
      </div>

      {/* Hero Image Section */}
      <div style={{ background: 'white', padding: '20px', display: 'flex', justifyContent: 'center', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ width: '100%', maxWidth: '400px', aspectRatio: '1/1', borderRadius: '24px', background: '#f1f5f9', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {product.image ? (
            <img 
              src={getImageUrl(product.image)!} 
              alt={product.productName} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : (
            <Package size={80} color="#94a3b8" />
          )}
        </div>
      </div>

      {/* Main Info */}
      <div style={{ padding: '24px 20px' }}>
        <div style={{ background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
          <div style={{ display: 'inline-flex', padding: '6px 12px', borderRadius: '8px', background: '#dbeafe', color: '#1e40af', fontSize: '12px', fontWeight: 800, marginBottom: '12px', textTransform: 'uppercase' }}>
            {product.categoryName}
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginBottom: '8px', lineHeight: 1.2 }}>{product.productName}</h1>
          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ opacity: 0.6 }}>Mã sản phẩm:</span>
            <span style={{ fontWeight: 600 }}>{product.id.substring(0, 12).toUpperCase()}</span>
          </div>
        </div>

        {/* Specs Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ color: '#0066CC', marginBottom: '8px' }}><Tag size={20} /></div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Thương hiệu</div>
            <div style={{ fontWeight: 700, fontSize: '16px' }}>{product.brandName}</div>
          </div>
          <div style={{ background: 'white', borderRadius: '20px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ color: '#22c55e', marginBottom: '8px' }}><DollarSign size={20} /></div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Đơn giá</div>
            <div style={{ fontWeight: 700, fontSize: '16px' }}>{product.price.toLocaleString()}đ</div>
          </div>
          <div style={{ background: 'white', borderRadius: '20px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ color: '#8b5cf6', marginBottom: '8px' }}><Layers size={20} /></div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Đơn vị tính</div>
            <div style={{ fontWeight: 700, fontSize: '16px' }}>{product.unit}</div>
          </div>
          <div style={{ background: 'white', borderRadius: '20px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ color: product.isLowStock ? '#ef4444' : '#10b981', marginBottom: '8px' }}>
              <Activity size={20} />
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Tồn kho hiện tại</div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: product.isLowStock ? '#ef4444' : 'inherit' }}>
              {product.quantity}
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{ background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <Info size={18} color="#0066CC" />
            <span style={{ fontWeight: 800, fontSize: '16px', color: '#1e293b' }}>Thông số mô tả</span>
          </div>
          <p style={{ color: '#475569', lineHeight: 1.6, fontSize: '15px', whiteSpace: 'pre-line' }}>
            {product.description || 'Không có mô tả chi tiết cho sản phẩm này.'}
          </p>
        </div>
      </div>

      {/* Footer Branding */}
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: 0.5, marginBottom: '8px' }}>
          <img src="/vnpt-logo-alone.png" alt="VNPT" style={{ height: '16px' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <span style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '1px' }}>VNPT VNPT WAREHOUSE</span>
        </div>
        <div style={{ fontSize: '11px', color: '#94a3b8' }}>© 2026 Tập đoàn Bưu chính Viễn thông Việt Nam</div>
      </div>
    </div>
  );
};

export default PublicProductView;
