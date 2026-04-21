import React, { useEffect, useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Package,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Camera,
  Save,
  QrCode,
  Download,
  Activity,
  AlertCircle,
  X,
  Info
} from 'lucide-react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import { productApi } from '../api/products';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../api/permissions';
import { useSearch } from '../contexts/SearchContext';
import { useDebounce } from '../hooks/useDebounce';
import type { Product, Category, Brand } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5020/api';
const ROOT_BASE = API_BASE.replace('/api', '');
const ProductListPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { searchQuery, setSearchQuery } = useSearch();
  const debouncedSearch = useDebounce(searchQuery, 500);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [serverIp, setServerIp] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // QR Modal
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrProduct, setQrProduct] = useState<Product | null>(null);

  const handleDownloadQR = () => {
    const canvas = document.getElementById('product-qr') as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `QR_${qrProduct?.productName || 'product'}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await productApi.getProducts({
        search: debouncedSearch,
        categoryId: selectedCategory || undefined,
        brandId: selectedBrand || undefined,
        pageNumber: page,
        pageSize: pageSize
      });
      setProducts(response.items);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServerIp = async () => {
    try {
      const response = await axios.get(`${API_BASE}/System/server-ip`);
      if (response.data && response.data.ip) {
        setServerIp(response.data.ip);
      }
    } catch (err) {
      console.warn('Could not auto-detect server IP:', err);
    }
  };

  useEffect(() => {
    const initData = async () => {
      try {
        const [cats, brs] = await Promise.all([
          productApi.getCategories(),
          productApi.getBrands()
        ]);
        setCategories(cats);
        setBrands(brs);
        fetchServerIp();
      } catch (error) {
        console.error('Failed to init filters:', error);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, pageSize, selectedCategory, selectedBrand, debouncedSearch]);

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    if (path.startsWith('data:')) return path;
    return `${ROOT_BASE}${path}`;
  };

  const handleOpenModal = (mode: 'create' | 'edit', product?: Product) => {
    setModalMode(mode);
    if (mode === 'edit' && product) {
      setCurrentProduct(product);
      setPreviewUrl(getImageUrl(product.image));
    } else {
      setCurrentProduct({
        productName: '',
        categoryId: '',
        brandId: '',
        quantity: 0,
        minQuantity: 5,
        unit: 'Cái',
        price: 0,
        description: ''
      });
      setPreviewUrl(null);
    }
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!currentProduct.productName?.trim()) return alert('Vui lòng nhập tên sản phẩm');
    if (!currentProduct.categoryId) return alert('Vui lòng chọn danh mục');
    if (!currentProduct.brandId) return alert('Vui lòng chọn thương hiệu');

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      
      // Explicit mapping to PascalCase to match backend C# DTOs exactly
      formData.append('ProductName', currentProduct.productName.trim());
      formData.append('CategoryId', currentProduct.categoryId);
      formData.append('BrandId', currentProduct.brandId);
      formData.append('Unit', currentProduct.unit || 'Cái');
      formData.append('MinQuantity', (currentProduct.minQuantity || 0).toString());
      formData.append('Price', (currentProduct.price || 0).toString().replace(',', '.')); // Ensure dot decimal
      formData.append('Description', currentProduct.description || '');
      
      // Only send Quantity on Create
      if (modalMode === 'create') {
        formData.append('Quantity', (currentProduct.quantity || 0).toString());
      }
      
      if (selectedFile) {
        formData.append('ImageFile', selectedFile);
      } else if (modalMode === 'edit' && currentProduct.image) {
        formData.append('Image', currentProduct.image);
      }

      if (modalMode === 'create') {
        const result = await productApi.createProduct(formData);
        console.log('Product created:', result);
      } else if (currentProduct.id) {
        await productApi.updateProduct(currentProduct.id, formData);
        console.log('Product updated');
      }
      
      setIsModalOpen(false);
      fetchProducts();
    } catch (error: any) {
      console.error('Save failure full error:', error);
      const errorData = error.response?.data;
      let msg = 'Lỗi không xác định';
      
      if (typeof errorData === 'string') msg = errorData;
      else if (errorData?.errors) {
        // Handle ASP.NET Validation errors
        msg = Object.values(errorData.errors).flat().join('\n');
      } else if (errorData?.message) msg = errorData.message;
      
      alert(`Không thể lưu:\n${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      await productApi.deleteProduct(id);
      fetchProducts();
    } catch (error) {
      console.error('Delete failure:', error);
      alert('Không thể xóa sản phẩm này.');
    }
  };

  return (
    <>
      <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Quản lý sản phẩm</h1>
          <p className="page-subtitle">Có tổng cộng {totalCount} thiết bị trong kho.</p>
        </div>
        {hasPermission(PERMISSIONS.Products.Create) && (
          <button onClick={() => handleOpenModal('create')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Thêm sản phẩm
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div className="search-wrapper" style={{ flex: 1, minWidth: '300px' }}>
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Tìm theo tên hoặc mã..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '42px' }} 
            />
          </div>
          
          <select 
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            className="form-input"
            style={{ minWidth: '180px', height: '42px' }}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
          </select>

          <select 
            value={selectedBrand}
            onChange={(e) => { setSelectedBrand(e.target.value); setPage(1); }}
            className="form-input"
            style={{ minWidth: '180px', height: '42px' }}
          >
            <option value="">Tất cả thương hiệu</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.brandName}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: '24px' }}>SẢN PHẨM</th>
                <th>DANH MỤC / HÃNG</th>
                <th>TỒN KHO CHUẨN</th>
                <th>HÀNG LỖI/HỎNG</th>
                <th>ĐƠN GIÁ</th>
                <th style={{ textAlign: 'right', paddingRight: '24px' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '100px 0', textAlign: 'center' }}>
                    <Loader2 className="animate-spin" style={{ margin: '0 auto', color: 'var(--primary)' }} />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '100px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Không tìm thấy sản phẩm nào.
                  </td>
                </tr>
              ) : products.map((product) => (
                <tr key={product.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row-hover">
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '46px', height: '46px', borderRadius: '10px', 
                        background: 'var(--primary-lighter)', border: '1px solid var(--border)',
                        display: 'flex', 
                        alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                      }}>
                        {product.image ? (
                          <img src={getImageUrl(product.image)!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Package size={24} color="var(--text-muted)" />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{product.productName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mã: {product.id.substring(0, 8).toUpperCase()}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>{product.categoryName}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{product.brandName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px', color: product.isLowStock ? 'var(--error)' : 'var(--text-primary)' }}>
                        {product.quantity}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{product.unit}</span>
                      {product.isLowStock && (
                        <div className="badge badge-danger" style={{ padding: '2px 8px', fontSize: '10px', fontWeight: 800 }}>THẤP</div>
                      )}
                    </div>
                    {(product as any).daysRemaining !== undefined && (
                      <div style={{ 
                        marginTop: '4px', 
                        fontSize: '11px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        color: ((product as any).daysRemaining ?? 0) < 7 ? 'var(--error)' : 'var(--text-muted)' 
                      }}>
                        <Activity size={12} />
                        {(product as any).daysRemaining !== null 
                          ? `Dự báo: còn ~${(product as any).daysRemaining} ngày` 
                          : 'Dự báo: Không có dữ liệu'}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        fontWeight: 700, 
                        fontSize: '15px', 
                        color: product.faultyQuantity > 0 ? '#F59E0B' : 'var(--text-muted)' 
                      }}>
                        {product.faultyQuantity || 0}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{product.unit}</span>
                      {product.faultyQuantity > 0 && (
                        <div className="badge" style={{ padding: '2px 8px', fontSize: '10px', fontWeight: 800, background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}>PHÂN LOẠI</div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>
                    {product.price.toLocaleString()}đ
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={() => { setQrProduct(product); setIsQrModalOpen(true); }} className="action-btn" title="Tạo mã QR">
                        <QrCode size={16} />
                      </button>
                      {hasPermission(PERMISSIONS.Products.Edit) && (
                        <button onClick={() => handleOpenModal('edit', product)} className="action-btn">
                          <Edit2 size={16} />
                        </button>
                      )}
                      {hasPermission(PERMISSIONS.Products.Delete) && (
                        <button onClick={() => handleDelete(product.id)} className="action-btn action-btn-danger">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', background: 'var(--primary-lighter)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Đang xem <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{products.length}</span> của <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{totalCount}</span> sản phẩm
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Hiển thị:</span>
              <select 
                value={pageSize}
                onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1); }}
                className="form-input"
                style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '12px', width: 'auto', background: 'white' }}
              >
                {[10, 25, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="action-btn"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Smart Numbered Pagination */}
            {Array.from({ length: Math.ceil(totalCount / pageSize) }).map((_, i) => {
              const p = i + 1;
              const totalPages = Math.ceil(totalCount / pageSize);
              
              // Only show first, last, current, and pages around current
              if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                return (
                  <button 
                    key={p}
                    onClick={() => setPage(p)}
                    className={page === p ? 'pagination-btn-active' : 'action-btn'}
                    style={{ 
                      minWidth: '38px', height: '38px', 
                      fontWeight: 700, fontSize: '14px'
                    }}
                  >
                    {p}
                  </button>
                );
              }
              
              // Show ellipsis
              if (p === page - 2 || p === page + 2) {
                return <span key={p} style={{ color: 'var(--text-muted)', margin: '0 4px' }}>...</span>;
              }
              
              return null;
            })}

            <button 
              disabled={page * pageSize >= totalCount}
              onClick={() => setPage(p => p + 1)}
              className="action-btn"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* QR Code Modal */}
      {isQrModalOpen && qrProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }} onClick={() => setIsQrModalOpen(false)}>
          <div className="card animate-scale-in" style={{ width: '400px', padding: '32px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Mã QR Sản phẩm</h3>
              <button onClick={() => setIsQrModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', display: 'inline-block', marginBottom: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', border: '1px solid var(--border)' }}>
              <QRCodeCanvas 
                id="product-qr"
                value={serverIp ? `http://${serverIp}:5173/p/${qrProduct.id}` : `${window.location.origin}/p/${qrProduct.id}`}
                size={220}
                level="H"
                includeMargin={true}
              />
              {window.location.hostname === 'localhost' && serverIp && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'var(--success-light)', borderRadius: '8px', fontSize: '11px', color: 'var(--success)', textAlign: 'left', maxWidth: '300px', display: 'flex', gap: '8px' }}>
                  <Info size={16} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Cấu hình tự động:</strong> QR code đã được trỏ về địa chỉ IP mạng <code>{serverIp}</code> để điện thoại có thể quét thành công.
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontWeight: 700, fontSize: '18px' }}>{qrProduct.productName}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>UID: {qrProduct.id}</div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setIsQrModalOpen(false)} className="action-btn" style={{ flex: 1, padding: '12px', fontWeight: 600 }}>Đóng</button>
              <button onClick={handleDownloadQR} className="btn-primary" style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Download size={18} /> Tải ảnh QR
              </button>
            </div>
            
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              <AlertCircle size={14} /> Quét để truy cập thông tin nhanh
            </div>
          </div>
        </div>
      )}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }} onClick={() => setIsModalOpen(false)}>
          <div className="card animate-fade-in" style={{ width: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '0', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--primary-lighter)' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>{modalMode === 'create' ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
                {/* Image Upload */}
                <div style={{ textAlign: 'center' }}>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    style={{ 
                      width: '100%', aspectRatio: '1/1', borderRadius: '16px', background: 'var(--primary-lighter)', 
                      border: '2px dashed var(--border-strong)', display: 'flex', flexDirection: 'column', 
                      alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative'
                    }}
                  >
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <>
                        <Camera size={40} color="var(--primary)" style={{ marginBottom: '12px', opacity: 0.5 }} />
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Tải lên ảnh sản phẩm</span>
                      </>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
                  <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>Mục tiêu: 1024x1024. Max 5MB.</p>
                </div>

                {/* Form Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label className="form-label">Tên sản phẩm</label>
                    <input 
                      required
                      className="form-input"
                      value={currentProduct.productName}
                      onChange={e => setCurrentProduct({ ...currentProduct, productName: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label">Danh mục</label>
                      <select 
                        required
                        className="form-input"
                        value={currentProduct.categoryId}
                        onChange={e => setCurrentProduct({ ...currentProduct, categoryId: e.target.value })}
                      >
                        <option value="">Chọn danh mục</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
                      </select>
                      {categories.length === 0 && <p style={{ fontSize: '11px', color: 'var(--error)', marginTop: '4px' }}>Chưa có danh mục. Hãy tạo trong mục "Danh mục & Brand".</p>}
                    </div>
                    <div>
                      <label className="form-label">Thương hiệu</label>
                      <select 
                        required
                        className="form-input"
                        value={currentProduct.brandId}
                        onChange={e => setCurrentProduct({ ...currentProduct, brandId: e.target.value })}
                      >
                        <option value="">Chọn hãng</option>
                        {brands.map(b => <option key={b.id} value={b.id}>{b.brandName}</option>)}
                      </select>
                      {brands.length === 0 && <p style={{ fontSize: '11px', color: 'var(--error)', marginTop: '4px' }}>Chưa có hãng. Hãy tạo trong mục "Danh mục & Brand".</p>}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: modalMode === 'create' ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label">Đơn vị</label>
                      <input 
                        className="form-input"
                        value={currentProduct.unit}
                        onChange={e => setCurrentProduct({ ...currentProduct, unit: e.target.value })}
                        placeholder="Cái, Bộ, Mét..."
                      />
                    </div>
                    {modalMode === 'create' && (
                      <div>
                        <label className="form-label">Số lượng đầu</label>
                        <input 
                          type="number"
                          className="form-input"
                          value={currentProduct.quantity}
                          onChange={e => setCurrentProduct({ ...currentProduct, quantity: parseInt(e.target.value) })}
                        />
                      </div>
                    )}
                    <div>
                      <label className="form-label">Min Stock</label>
                      <input 
                        type="number"
                        className="form-input"
                        value={currentProduct.minQuantity}
                        onChange={e => setCurrentProduct({ ...currentProduct, minQuantity: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="form-label">Đơn giá (VNĐ)</label>
                      <input 
                        type="number"
                        className="form-input"
                        value={currentProduct.price}
                        onChange={e => setCurrentProduct({ ...currentProduct, price: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Mô tả chi tiết</label>
                    <textarea 
                      rows={3}
                      className="form-input"
                      style={{ resize: 'none', minHeight: '100px' }}
                      value={currentProduct.description || ''}
                      onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '32px', display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '12px 24px', borderRadius: '10px', border: '1px solid var(--border)', background: 'white', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}>Hủy bỏ</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ padding: '12px 32px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Lưu sản phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .table-row-hover:hover td { background: var(--primary-lighter); }
        .pagination-btn-active { background: var(--primary); color: white; border: none; box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3); }
      `}</style>
    </>
  );
};

export default ProductListPage;
