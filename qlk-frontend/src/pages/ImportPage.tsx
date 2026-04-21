import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  Loader2,
  Package,
  Warehouse as WarehouseIcon, 
  Cpu, 
  Zap, 
  QrCode, 
  Smartphone, 
  Wifi,
  Hash,
  Link,
  Calendar,
  User as UserIcon,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import QRScannerModal from '../components/QRScannerModal';
import ProductQuickView from '../components/ProductQuickView';
import { warehouseApi } from '../api/warehouses';
import type { Warehouse } from '../api/warehouses';
import { productApi } from '../api/products';
import { importApi } from '../api/imports';
import type { ImportReceipt } from '../api/imports';
import type { Product } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../api/permissions';
import { useSearch } from '../contexts/SearchContext';
import { useDebounce } from '../hooks/useDebounce';
import { extractProductId } from '../utils/qrUtils';

type ViewMode = 'LIST' | 'CREATE' | 'DETAIL';

const ImportPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user, hasPermission } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [selectedImport, setSelectedImport] = useState<ImportReceipt | null>(null);
  
  const [imports, setImports] = useState<ImportReceipt[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { searchQuery } = useSearch();
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Form state
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [note, setNote] = useState('');
  const [details, setDetails] = useState<{ 
    productId: string; 
    quantity: number; 
    price: number;
    serialNumbers: string[];
    macAddresses: string[];
    warrantyMonths: number;
  }[]>([
    { productId: '', quantity: 1, price: 0, serialNumbers: [], macAddresses: [], warrantyMonths: 12 }
  ]);
  const [activeDetailIndex, setActiveDetailIndex] = useState<number | null>(null);
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const handleScanSuccess = (decodedText: string) => {
    const productId = extractProductId(decodedText);
    const product = products.find(p => p.id === productId);
    
    if (product) {
      setScannedProduct(product);
      setIsQuickViewOpen(true);
    } else {
      alert('Không tìm thấy sản phẩm này trong danh sách dữ liệu. Vui lòng kiểm tra lại mã QR.');
    }
  };

  const handleConfirmAdd = (product: Product) => {
    const emptyIndex = details.findIndex(d => !d.productId);
    if (emptyIndex !== -1) {
      updateDetail(emptyIndex, 'productId', product.id);
    } else {
      setDetails([...details, { productId: product.id, quantity: 1, price: product.price, serialNumbers: [], macAddresses: [], warrantyMonths: 12 }]);
    }
  };

  const fetchImports = async () => {
    setIsLoading(true);
    try {
      const data = await importApi.getAll({ 
        search: debouncedSearch,
        pageNumber: page,
        pageSize: pageSize
      });
      setImports(data.items);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error('Failed to fetch imports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInitialData = async () => {
    try {
      const [wData, pData] = await Promise.all([
        warehouseApi.getAll(),
        productApi.getProducts({ search: debouncedSearch, pageSize: 50 })
      ]);
      setWarehouses(wData.items);
      setProducts(pData.items);
      if (wData.items.length > 0 && !selectedWarehouse) setSelectedWarehouse(wData.items[0].id);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  useEffect(() => {
    if (viewMode === 'LIST') {
      fetchImports();
    } else if (viewMode === 'CREATE') {
      fetchInitialData();
    }
  }, [viewMode, debouncedSearch, page, pageSize]);

  const addDetail = () => {
    setDetails([...details, { productId: '', quantity: 1, price: 0, serialNumbers: [], macAddresses: [], warrantyMonths: 12 }]);
  };

  const removeDetail = (index: number) => {
    if (details.length > 1) {
      setDetails(details.filter((_, i) => i !== index));
    }
  };

  const updateDetail = (index: number, field: string, value: any) => {
    const newDetails = [...details];
    (newDetails[index] as any)[field] = value;
    
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        newDetails[index].price = product.price;
      }
    }
    
    if (field === 'quantity') {
      const q = value;
      if (newDetails[index].serialNumbers.length > q) {
        newDetails[index].serialNumbers = newDetails[index].serialNumbers.slice(0, q);
      }
      if (newDetails[index].macAddresses.length > q) {
        newDetails[index].macAddresses = newDetails[index].macAddresses.slice(0, q);
      }
    }
    
    setDetails(newDetails);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouse || isSubmitting) return;

    const validDetails = details.filter(d => d.productId && d.quantity > 0);
    if (validDetails.length === 0) {
      alert('Vui lòng thêm ít nhất một sản phẩm');
      return;
    }

    setIsSubmitting(true);
    try {
      await importApi.create({
        warehouseId: selectedWarehouse,
        createdBy: user?.id || '',
        note,
        details: validDetails
      });
      alert('Nhập kho thành công!');
      setViewMode('LIST');
      // Reset form
      setNote('');
      setDetails([{ productId: '', quantity: 1, price: 0, serialNumbers: [], macAddresses: [], warrantyMonths: 12 }]);
    } catch (error) {
      console.error('Failed to create import:', error);
      alert('Lỗi khi tạo phiếu nhập kho');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderListView = () => (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={onBack} className="action-btn" style={{ width: '40px', height: '40px' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">Lịch sử nhập kho</h1>
            <p className="page-subtitle">Quản lý và xem lại các phiếu nhập hàng vào kho</p>
          </div>
        </div>
        {hasPermission(PERMISSIONS.Imports.Create) && (
          <button 
            onClick={() => setViewMode('CREATE')}
            className="btn-primary"
            style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={20} /> Tạo phiếu mới
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
        {isLoading ? (
          <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}>
            <Loader2 className="animate-spin" size={40} color="var(--primary)" />
          </div>
        ) : imports.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
            <p>Chưa có phiếu nhập kho nào</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: '24px' }}>Mã phiếu</th>
                    <th>Kho hàng</th>
                    <th>Ngày nhập</th>
                    <th>Người tạo</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'right', paddingRight: '24px' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {imports.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row-hover">
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{item.receiptCode}</span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <WarehouseIcon size={14} color="var(--text-muted)" />
                          {item.warehouseName}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                          <Calendar size={14} />
                          {new Date(item.importDate).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                          <UserIcon size={14} color="var(--text-muted)" />
                          {item.creatorFullName}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ fontWeight: 700 }}>{item.totalAmount.toLocaleString()} VNĐ</span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span className={`badge ${item.status === 1 ? 'badge-success' : 'badge-warning'}`}>
                          {item.statusLabel}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <button 
                          onClick={() => {
                            setSelectedImport(item);
                            setViewMode('DETAIL');
                          }}
                          className="action-btn"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', background: 'var(--primary-lighter)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  Đang xem <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{imports.length}</span> của <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{totalCount}</span> phiếu
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Hiển thị:</span>
                  <select 
                    value={pageSize}
                    onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1); }}
                    className="form-input"
                    style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '12px', width: 'auto' }}
                  >
                    {[10, 25, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button 
                  disabled={page === 1}
                  type="button"
                  onClick={() => setPage(p => p - 1)}
                  className="action-btn"
                  style={{ padding: '8px', borderRadius: '8px', opacity: page === 1 ? 0.3 : 1 }}
                >
                  <ChevronLeft size={18} />
                </button>

                {Array.from({ length: Math.ceil(totalCount / pageSize) }).map((_, i) => {
                  const p = i + 1;
                  const totalPages = Math.ceil(totalCount / pageSize);
                  if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                    return (
                      <button 
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={page === p ? 'pagination-btn-active' : 'action-btn'}
                        style={{ minWidth: '34px', height: '34px', borderRadius: '8px', fontWeight: 700, fontSize: '13px' }}
                      >
                        {p}
                      </button>
                    );
                  }
                  if (p === page - 2 || p === page + 2) return <span key={p} style={{ color: 'var(--text-muted)' }}>...</span>;
                  return null;
                })}

                <button 
                  disabled={page * pageSize >= totalCount}
                  type="button"
                  onClick={() => setPage(p => p + 1)}
                  className="action-btn"
                  style={{ padding: '8px', borderRadius: '8px', opacity: (page * pageSize >= totalCount) ? 0.3 : 1 }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderCreateView = () => (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => setViewMode('LIST')} className="action-btn" style={{ width: '40px', height: '40px' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="page-title">Tạo phiếu nhập kho</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            const form = document.querySelector('form');
            if (form) form.requestSubmit();
          }}
          className="btn-primary"
          disabled={isSubmitting}
          style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0, 102, 204, 0.2)' }}
        >
          {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          Hoàn thành Ngay
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={20} color="var(--primary)" /> Danh sách hàng hóa
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {details.map((detail, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr 120px 40px', gap: '12px', alignItems: 'end' }}>
                  <div>
                    <label className="form-label">Sản phẩm</label>
                    <select 
                      value={detail.productId}
                      onChange={(e) => updateDetail(index, 'productId', e.target.value)}
                      className="form-input"
                      required
                    >
                      <option value="">Chọn sản phẩm...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.productName} ({p.quantity} {p.unit})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">SL</label>
                    <input 
                      type="number"
                      min="1"
                      value={detail.quantity}
                      onChange={(e) => updateDetail(index, 'quantity', parseInt(e.target.value))}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Đơn giá (VNĐ)</label>
                    <input 
                      type="number"
                      value={detail.price}
                      onChange={(e) => updateDetail(index, 'price', parseInt(e.target.value))}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <button 
                      type="button"
                      onClick={() => { setActiveDetailIndex(index); setIsSerialModalOpen(true); }}
                      className="action-btn"
                      style={{ height: '40px', width: '100%', fontSize: '12px', display: 'flex', gap: '4px', border: detail.serialNumbers.length > 0 ? '1px solid #16a34a' : '1px solid var(--border)', color: detail.serialNumbers.length > 0 ? '#16a34a' : 'inherit' }}
                      disabled={!detail.productId}
                    >
                      <Cpu size={14} /> Định danh {detail.serialNumbers.length > 0 && `(${detail.serialNumbers.length})`}
                    </button>
                  </div>
                  <button 
                    type="button"
                    onClick={() => removeDetail(index)}
                    style={{ background: 'none', border: 'none', color: '#EF4444', height: '40px', cursor: 'pointer', opacity: details.length > 1 ? 1 : 0.3 }}
                    disabled={details.length <= 1}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button 
                type="button"
                onClick={addDetail}
                className="action-btn"
                style={{ flex: 2, padding: '12px', borderStyle: 'dashed', color: 'var(--primary)', fontWeight: 600 }}
              >
                <Plus size={18} /> Thêm hàng hóa
              </button>
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="btn-primary"
                style={{ flex: 1, padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--primary)' }}
              >
                <QrCode size={18} /> Quét mã QR
              </button>
            </div>

            <QRScannerModal 
              isOpen={isScannerOpen} 
              onClose={() => setIsScannerOpen(false)} 
              onScanSuccess={handleScanSuccess} 
            />

            <ProductQuickView 
              isOpen={isQuickViewOpen}
              onClose={() => {
                setIsQuickViewOpen(false);
                setScannedProduct(null);
              }}
              product={scannedProduct}
              actionButton={{
                label: "Thêm vào phiếu nhập",
                onClick: handleConfirmAdd
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '0px', alignSelf: 'start' }}>
            <div className="card">
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <WarehouseIcon size={20} color="var(--primary)" /> Thông tin nhập
              </h3>
              
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Kho hàng</label>
                <select 
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">Chọn kho...</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.warehouseName}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Ghi chú</label>
                <textarea 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="form-input"
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  placeholder="Nhập ghi chú phiếu nhập..."
                />
              </div>

              <div style={{ padding: '20px', background: 'var(--primary-lighter)', borderRadius: '12px', marginTop: 'auto', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  <span>Tổng tiền hàng:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{details.reduce((sum, d) => sum + (d.quantity * d.price), 0).toLocaleString()} VNĐ</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '20px', color: 'var(--primary)', marginTop: '12px', borderTop: '2px dashed var(--border)', paddingTop: '12px' }}>
                  <span>TỔNG CỘNG:</span>
                  <span>{details.reduce((sum, d) => sum + (d.quantity * d.price), 0).toLocaleString()} VNĐ</span>
                </div>
              </div>

              <button 
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
                style={{ width: '100%', marginTop: '24px', padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                Hoàn thành nhập kho
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Serial/MAC Input Modal */}
      {isSerialModalOpen && activeDetailIndex !== null && (
        <div className="modal-overlay" style={{ zIndex: 200 }}>
          <div className="modal-content glass-modal-content animate-scale-in" style={{ maxWidth: '800px', width: '95%', border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '16px', 
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  boxShadow: '0 8px 16px rgba(0, 102, 204, 0.2)' 
                }}>
                  <Smartphone size={32} />
                </div>
                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>Định danh thiết bị</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Sản phẩm: <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{products.find(p => p.id === details[activeDetailIndex].productId)?.productName}</span>
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => { setIsSerialModalOpen(false); setActiveDetailIndex(null); }} 
                className="action-btn"
                style={{ background: '#f1f5f9', borderRadius: '12px' }}
              >
                <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>

            <div className="card" style={{ background: 'var(--primary-lighter)', border: '1px dashed var(--primary)', marginBottom: '24px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Wifi size={20} color="var(--primary)" />
                <div>
                  <label className="form-label" style={{ marginBottom: '4px' }}>Thời gian bảo hành (Tháng)</label>
                  <input 
                    type="number" 
                    value={details[activeDetailIndex].warrantyMonths} 
                    onChange={(e) => updateDetail(activeDetailIndex, 'warrantyMonths', parseInt(e.target.value))}
                    className="form-input focus-glow"
                    style={{ maxWidth: '120px' }}
                  />
                </div>
              </div>
            </div>

            <div 
              className="premium-scroll"
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', 
                gap: '20px', 
                maxHeight: '450px', 
                overflowY: 'auto', 
                padding: '4px' 
              }}
            >
              {Array.from({ length: details[activeDetailIndex].quantity }).map((_, i) => (
                <div key={i} className="slot-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span className="slot-badge">Thiết bị #{String(i + 1).padStart(2, '0')}</span>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: (details[activeDetailIndex].serialNumbers[i] && details[activeDetailIndex].macAddresses[i]) ? 'var(--success)' : 'var(--text-muted)' }}></div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="input-icon-group">
                      <Hash size={16} />
                      <input 
                        type="text" 
                        placeholder="Số Serial (S/N)" 
                        className="form-input focus-glow"
                        value={details[activeDetailIndex].serialNumbers[i] || ''}
                        onChange={(e) => {
                          const newSerials = [...details[activeDetailIndex].serialNumbers];
                          newSerials[i] = e.target.value;
                          updateDetail(activeDetailIndex, 'serialNumbers', newSerials);
                        }}
                      />
                    </div>
                    <div className="input-icon-group">
                      <Link size={16} />
                      <input 
                        type="text" 
                        placeholder="Địa chỉ MAC"
                        className="form-input focus-glow"
                        value={details[activeDetailIndex].macAddresses[i] || ''}
                        onChange={(e) => {
                          const newMacs = [...details[activeDetailIndex].macAddresses];
                          newMacs[i] = e.target.value;
                          updateDetail(activeDetailIndex, 'macAddresses', newMacs);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button"
                onClick={() => { setIsSerialModalOpen(false); setActiveDetailIndex(null); }} 
                className="btn-primary" 
                style={{ padding: '10px 32px' }}
              >
                Lưu thông tin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDetailView = () => {
    if (!selectedImport) return null;
    return (
      <div className="animate-fade-in">
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => setViewMode('LIST')} className="action-btn" style={{ width: '40px', height: '40px' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="page-title">Chi tiết phiếu {selectedImport.receiptCode}</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>Danh sách hàng hóa</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {(selectedImport.details ?? []).map((detail: any, idx) => (
                <div key={idx} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{detail.productName}</div>
                    <div style={{ fontWeight: 700 }}>{(detail.quantity * detail.price).toLocaleString()} VNĐ</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    <div>SL: <strong>{detail.quantity}</strong></div>
                    <div>Giá: <strong>{detail.price.toLocaleString()}</strong></div>
                    <div>Đơn vị: <strong>{detail.unit}</strong></div>
                  </div>
                  
                  {detail.equipments && detail.equipments.length > 0 && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #e2e8f0' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Cpu size={12} /> Danh sách thiết bị cá thể:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {detail.equipments.map((eq: any, eqIdx: number) => (
                          <div key={eqIdx} style={{ fontSize: '11px', padding: '6px 10px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                            <div style={{ color: 'var(--primary)', fontWeight: 700 }}>SN: {eq.serialNumber}</div>
                            {eq.macAddress && <div style={{ color: '#64748b' }}>MAC: {eq.macAddress}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ padding: '24px 12px 12px', textAlign: 'right', fontWeight: 800, color: 'var(--primary)', fontSize: '20px', borderTop: '2px solid #f1f5f9', marginTop: '20px' }}>
              Tổng cộng: {selectedImport.totalAmount.toLocaleString()} VNĐ
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>Thông tin phiếu</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kho nhập</label>
                <div style={{ fontWeight: 600 }}>{selectedImport.warehouseName}</div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Ngày nhập</label>
                <div>{new Date(selectedImport.importDate).toLocaleString('vi-VN')}</div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Người lập phiếu</label>
                <div>{selectedImport.creatorFullName}</div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Trạng thái</label>
                <span className={`badge ${selectedImport.status === 1 ? 'badge-success' : 'badge-warning'}`}>
                  {selectedImport.statusLabel}
                </span>
              </div>
              {selectedImport.note && (
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Ghi chú</label>
                  <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{selectedImport.note}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main>
      {viewMode === 'LIST' && renderListView()}
      {viewMode === 'CREATE' && renderCreateView()}
      {viewMode === 'DETAIL' && renderDetailView()}
      <style>{`
        .pagination-btn-active {
          background: var(--primary);
          color: white;
          border: none;
          cursor: default;
        }
      `}</style>
    </main>
  );
};

export default ImportPage;
