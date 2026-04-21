import React from 'react';
import { 
  X, 
  Package, 
  Tag, 
  Layers, 
  Database, 
  Info,
  DollarSign
} from 'lucide-react';
import type { Product } from '../types';

interface ProductQuickViewProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  actionButton?: {
    label: string;
    onClick: (product: Product) => void;
  };
}

const ProductQuickView: React.FC<ProductQuickViewProps> = ({ isOpen, onClose, product, actionButton }) => {
  if (!isOpen || !product) return null;

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    if (path.startsWith('data:')) return path;
    const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5020/api').replace('/api', '');
    return `${apiBase}${path}`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2500
    }} onClick={onClose}>
      <div 
        className="card animate-scale-in" 
        style={{ 
          width: '850px', 
          padding: 0, 
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1.8fr',
          border: '1px solid rgba(255,255,255,0.1)'
        }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Left Side: Image */}
        <div style={{ background: 'var(--primary-lighter)', position: 'relative', borderRight: '1px solid var(--border)' }}>
          {product.image ? (
            <img 
              src={getImageUrl(product.image)!} 
              alt={product.productName} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <Package size={80} style={{ opacity: 0.1, marginBottom: '16px' }} />
              <span>Không có ảnh</span>
            </div>
          )}
          
          <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
            <span style={{ 
              padding: '6px 12px', 
              borderRadius: '20px', 
              fontSize: '11px', 
              fontWeight: 800,
              background: product.isLowStock ? 'var(--error)' : 'var(--primary)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              {product.isLowStock ? 'SẮP HẾT HÀNG' : 'SẴN SÀNG'}
            </span>
          </div>
        </div>

        {/* Right Side: Details */}
        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', lineHeight: 1.2 }}>{product.productName}</h2>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>ID: {product.id.toUpperCase()}</span>
                <span>•</span>
                <span>Cập nhật: {new Date(product.updatedAt || product.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="action-btn" 
              style={{ width: '36px', height: '36px' }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0,102,204,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Layers size={20} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Danh mục</div>
                <div style={{ fontWeight: 600 }}>{product.categoryName}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                <Tag size={20} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Thương hiệu</div>
                <div style={{ fontWeight: 600 }}>{product.brandName}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
                <Database size={20} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tồn kho hiện tại</div>
                <div style={{ fontWeight: 700, fontSize: '18px' }}>{product.quantity} <span style={{ fontSize: '12px', fontWeight: 400 }}>{product.unit}</span></div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(139,94,242,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5EF2' }}>
                <DollarSign size={20} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Đơn giá niêm yết</div>
                <div style={{ fontWeight: 700, fontSize: '18px' }}>{product.price.toLocaleString()}đ</div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '32px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600 }}>
              <Info size={16} /> 
              Mô tả chi tiết
            </div>
            <div style={{ 
              padding: '16px', 
              background: 'var(--primary-lighter)', 
              borderRadius: '12px',
              fontSize: '14px',
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              minHeight: '100px'
            }}>
              {product.description || 'Không có mô tả chi tiết cho sản phẩm này.'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            {actionButton ? (
              <>
                <button onClick={onClose} className="action-btn" style={{ flex: 1, padding: '14px', fontWeight: 600 }}>
                  Bỏ qua
                </button>
                <button 
                  onClick={() => {
                    actionButton.onClick(product);
                    onClose();
                  }} 
                  className="btn-primary" 
                  style={{ flex: 2, padding: '14px', borderRadius: '12px', fontWeight: 700 }}
                >
                  {actionButton.label}
                </button>
              </>
            ) : (
              <button onClick={onClose} className="btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 700 }}>
                Đã hiểu
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductQuickView;
