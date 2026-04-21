import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  Loader2,
  Package,
  Warehouse as WarehouseIcon,
  Calendar,
  User as UserIcon,
  Eye,
  ChevronLeft,
  ChevronRight,
  QrCode,
  RotateCcw,
  Cpu,
  Zap,
  Smartphone,
  Wifi,
  Hash,
  Link,
  ShieldCheck,
  Check
} from 'lucide-react';
import QRScannerModal from '../components/QRScannerModal';
import ProductQuickView from '../components/ProductQuickView';
import { warehouseApi } from '../api/warehouses';
import type { Warehouse } from '../api/warehouses';
import { productApi } from '../api/products';
import { userApi } from '../api/users';
import { retrievalApi } from '../api/retrievals';
import type { RetrievalReceipt, User, Product } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useSearch } from '../contexts/SearchContext';
import { useDebounce } from '../hooks/useDebounce';
import { extractProductId } from '../utils/qrUtils';

type ViewMode = 'LIST' | 'CREATE' | 'DETAIL';

const RetrievalPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { hasPermission, user } = useAuth();
  const isTechnician = user?.roleCode === 'TECHNICIAN';
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [selectedRetrieval, setSelectedRetrieval] = useState<RetrievalReceipt | null>(null);
  
  const [retrievals, setRetrievals] = useState<RetrievalReceipt[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { searchQuery } = useSearch();
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Form state
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [note, setNote] = useState('');
  const [details, setDetails] = useState<{ productId: string; quantity: number; condition: string; serialNumbers: string[] }[]>([
    { productId: '', quantity: 1, condition: 'Tốt', serialNumbers: [] }
  ]);

  // Serial input state
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
      setDetails([...details, { productId: product.id, quantity: 1, condition: 'Tốt', serialNumbers: [] }]);
    }
  };

  const fetchRetrievals = async () => {
    setIsLoading(true);
    try {
      const data = await retrievalApi.getAll({ 
        search: debouncedSearch,
        pageNumber: page,
        pageSize: pageSize,
        technicianId: isTechnician ? user?.id : undefined
      });
      setRetrievals(data.items);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error('Failed to fetch retrievals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInitialData = async () => {
    try {
      const [wData, pData, uData] = await Promise.all([
        warehouseApi.getAll(),
        productApi.getProducts({ pageSize: 100 }),
        userApi.getAll()
      ]);
      setWarehouses(wData.items);
      setProducts(pData.items);
      const techList = uData.filter(u => u.roleCode === 'TECHNICIAN' || u.roleCode === 'ADMIN');
      setTechnicians(techList);
      
      if (wData.items.length > 0 && !selectedWarehouse) setSelectedWarehouse(wData.items[0].id);
      
      if (isTechnician && user?.id) {
        setSelectedTechnician(user.id);
      } else if (techList.length > 0 && !selectedTechnician) {
        setSelectedTechnician(techList[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  useEffect(() => {
    if (viewMode === 'LIST') {
      fetchRetrievals();
    } else if (viewMode === 'CREATE') {
      fetchInitialData();
    }
  }, [viewMode, debouncedSearch, page, pageSize]);

  const addDetail = () => {
    setDetails([...details, { productId: '', quantity: 1, condition: 'Tốt', serialNumbers: [] }]);
  };

  const removeDetail = (index: number) => {
    if (details.length > 1) {
      setDetails(details.filter((_, i) => i !== index));
    }
  };

  const updateDetail = (index: number, field: string, value: any) => {
    const newDetails = [...details];
    (newDetails[index] as any)[field] = value;
    
    if (field === 'quantity') {
      const q = value;
      if (newDetails[index].serialNumbers.length > q) {
        newDetails[index].serialNumbers = newDetails[index].serialNumbers.slice(0, q);
      }
    }
    
    setDetails(newDetails);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouse || !selectedTechnician || isSubmitting) return;

    const validDetails = details.filter(d => d.productId && d.quantity > 0);
    if (validDetails.length === 0) {
      alert('Vui lòng thêm ít nhất một sản phẩm');
      return;
    }

    setIsSubmitting(true);
    try {
      await retrievalApi.create({
        warehouseId: selectedWarehouse,
        technicianId: selectedTechnician,
        note,
        details: validDetails
      });
      alert('Thu hồi thiết bị thành công!');
      setViewMode('LIST');
      setNote('');
      setDetails([{ productId: '', quantity: 1, condition: 'Tốt', serialNumbers: [] }]);
    } catch (error: any) {
      console.error('Failed to create retrieval:', error);
      const message = error.response?.data?.message || error.response?.data || 'Lỗi khi tạo phiếu thu hồi';
      alert(typeof message === 'string' ? message : 'Lỗi khi tạo phiếu thu hồi');
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
            <h1 className="page-title">Thu hồi thiết bị</h1>
            <p className="page-subtitle">Quản lý các phiếu thu hồi vật tư từ kỹ thuật viên</p>
          </div>
        </div>
        {hasPermission('Retrievals.Create') && (
          <button 
            onClick={() => setViewMode('CREATE')}
            className="btn-primary"
            style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={20} /> Tạo phiếu thu hồi
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
        {isLoading ? (
          <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}>
            <Loader2 className="animate-spin" size={40} color="var(--primary)" />
          </div>
        ) : retrievals.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RotateCcw size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
            <p>Chưa có phiếu thu hồi nào</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: '24px' }}>Mã phiếu</th>
                    <th>Kho nhận</th>
                    <th>Kỹ thuật viên trả</th>
                    <th>Ngày thu hồi</th>
                    <th>Số mặt hàng</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'right', paddingRight: '24px' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {retrievals.map((item) => (
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                          <UserIcon size={14} color="var(--text-muted)" />
                          {item.technicianName}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                          <Calendar size={14} />
                          {new Date(item.retrievalDate).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ fontWeight: 700 }}>{item.details?.length || 0}</span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span className={`badge ${item.status === 1 ? 'badge-success' : 'badge-warning'}`}>
                          {item.status === 1 ? 'Hoàn thành' : 'Chờ xử lý'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <button 
                          onClick={() => {
                            setSelectedRetrieval(item);
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
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Đang xem <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{retrievals.length}</span> của <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{totalCount}</span> phiếu
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="action-btn"><ChevronLeft size={18} /></button>
                <button disabled={page * pageSize >= totalCount} onClick={() => setPage(p => p + 1)} className="action-btn"><ChevronRight size={18} /></button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderCreateView = () => (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => setViewMode('LIST')} className="action-btn" style={{ width: '40px', height: '40px' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="page-title">Tạo phiếu thu hồi thiết bị</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={20} color="var(--primary)" /> Danh sách thiết bị thu hồi
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
                        <option key={p.id} value={p.id}>{p.productName} ({p.unit})</option>
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
                    <label className="form-label">Tình trạng</label>
                    <select 
                      value={detail.condition}
                      onChange={(e) => updateDetail(index, 'condition', e.target.value)}
                      className="form-input"
                    >
                      <option value="Tốt">Tốt</option>
                      <option value="Cũ">Cũ</option>
                      <option value="Hỏng">Hỏng (Cần sửa)</option>
                      <option value="Mất phụ kiện">Mất phụ kiện</option>
                    </select>
                  </div>
                  <div>
                    <button 
                      type="button"
                      onClick={() => { setActiveDetailIndex(index); setIsSerialModalOpen(true); }}
                      className="action-btn"
                      style={{ height: '40px', width: '100%', fontSize: '12px', display: 'flex', gap: '4px', border: detail.serialNumbers.length > 0 ? '1px solid #16a34a' : '1px solid var(--border)', color: detail.serialNumbers.length > 0 ? '#16a34a' : 'inherit' }}
                      disabled={!detail.productId}
                    >
                      <Cpu size={14} /> Nhập Serial {detail.serialNumbers.length > 0 && `(${detail.serialNumbers.length})`}
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
                <Plus size={18} /> Thêm thiết bị
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
                label: "Thêm vào phiếu thu hồi",
                onClick: handleConfirmAdd
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card">
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <WarehouseIcon size={20} color="var(--primary)" /> Thông tin thu hồi
              </h3>
              
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Kho hàng nhận</label>
                <select 
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">Chọn kho nhận...</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.warehouseName}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Kỹ thuật viên trả hàng</label>
                <select 
                  value={selectedTechnician}
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">Chọn kỹ thuật viên...</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName} ({t.roleName})</option>
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
                  placeholder="Lý do thu hồi, tình trạng chung..."
                />
              </div>

              <button 
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
                style={{ width: '100%', marginTop: '24px', padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                Hoàn thành thu hồi
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Serial Numbers Modal */}
      {isSerialModalOpen && activeDetailIndex !== null && (
        <div className="modal-overlay" style={{ zIndex: 200 }}>
          <div className="modal-content glass-modal-content animate-scale-in" style={{ maxWidth: '600px', width: '90%', border: 'none' }}>
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
                  <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>Nhập Serial Number</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Tổng số: <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{details[activeDetailIndex].quantity}</span> thiết bị thu hồi
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

            <div className="premium-scroll" style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '8px', padding: '4px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Array.from({ length: details[activeDetailIndex].quantity }).map((_, i) => (
                <div key={i} className="slot-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span className="slot-badge">Thiết bị #{String(i + 1).padStart(2, '0')}</span>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: details[activeDetailIndex].serialNumbers[i] ? 'var(--success)' : 'var(--text-muted)' }}></div>
                  </div>
                  
                  <div className="input-icon-group">
                    <Hash size={18} />
                    <input 
                      type="text" 
                      placeholder="Nhập Serial Number..." 
                      className="form-input focus-glow" 
                      style={{ fontSize: '15px' }}
                      value={details[activeDetailIndex].serialNumbers[i] || ''}
                      onChange={(e) => {
                        const newSerials = [...details[activeDetailIndex].serialNumbers];
                        newSerials[i] = e.target.value;
                        updateDetail(activeDetailIndex, 'serialNumbers', newSerials);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
               <button 
                type="button"
                onClick={() => { setIsSerialModalOpen(false); setActiveDetailIndex(null); }} 
                className="btn-primary" 
                style={{ padding: '14px 48px', borderRadius: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 16px rgba(0, 102, 204, 0.2)' }}
              >
                <Check size={20} strokeWidth={3} /> Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDetailView = () => {
    if (!selectedRetrieval) return null;
    return (
      <div className="animate-fade-in">
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => setViewMode('LIST')} className="action-btn" style={{ width: '40px', height: '40px' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="page-title">Chi tiết phiếu thu hồi {selectedRetrieval.receiptCode}</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>Danh sách thiết bị</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedRetrieval.details.map((detail: any, idx) => (
                <div key={idx} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{detail.productName}</div>
                    <div style={{ fontWeight: 700 }}>{detail.quantity} {detail.unit}</div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <span className={`badge ${detail.condition === 'Tốt' ? 'badge-success' : 'badge-warning'}`}>
                      {detail.condition || 'Chưa rõ'}
                    </span>
                  </div>
                  
                  {detail.serialNumbers && detail.serialNumbers.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {detail.serialNumbers.map((sn: string, snIdx: number) => (
                        <div key={snIdx} style={{ fontSize: '11px', padding: '6px 10px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                          SN: <strong>{sn}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>Thông tin phiếu</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kho nhận</label>
                <div style={{ fontWeight: 600 }}>{selectedRetrieval.warehouseName}</div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kỹ thuật viên trả hàng</label>
                <div style={{ fontWeight: 600 }}>{selectedRetrieval.technicianName}</div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Ngày thu hồi</label>
                <div>{new Date(selectedRetrieval.retrievalDate).toLocaleString('vi-VN')}</div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Trạng thái</label>
                <span className="badge badge-success">Đã hoàn thành</span>
              </div>
              {selectedRetrieval.note && (
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Ghi chú</label>
                  <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{selectedRetrieval.note}</div>
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
    </main>
  );
};

export default RetrievalPage;
