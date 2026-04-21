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
  TruckIcon,
  QrCode,
  Cpu,
  CheckCircle2,
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
import { exportApi } from '../api/exports';
import type { ExportReceipt } from '../api/exports';
import { userApi } from '../api/users';
import { equipmentApi } from '../api/individualEquipment';
import type { IndividualEquipmentSummaryDto } from '../api/individualEquipment';
import type { Product, User } from '../types/index';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../api/permissions';
import { useSearch } from '../contexts/SearchContext';
import { useDebounce } from '../hooks/useDebounce';
import { extractProductId } from '../utils/qrUtils';

type ViewMode = 'LIST' | 'CREATE' | 'DETAIL';

const ExportPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { hasPermission } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [selectedExport, setSelectedExport] = useState<ExportReceipt | null>(null);

  const [exports, setExports] = useState<ExportReceipt[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { searchQuery } = useSearch();
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Form state
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [note, setNote] = useState('');
  const [details, setDetails] = useState<{ productId: string; quantity: number; serialNumbers: string[]; macAddresses: string[] }[]>([
    { productId: '', quantity: 1, serialNumbers: [], macAddresses: [] },
  ]);

  // Equipment selection state
  const [isEquipModalOpen, setIsEquipModalOpen] = useState(false);
  const [activeDetailIndex, setActiveDetailIndex] = useState<number | null>(null);
  const [availableEquipments, setAvailableEquipments] = useState<IndividualEquipmentSummaryDto[]>([]);
  const [loadingEquipments, setLoadingEquipments] = useState(false);

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
      setDetails([...details, { productId: product.id, quantity: 1, serialNumbers: [], macAddresses: [] }]);
    }
  };

  const fetchExports = async () => {
    setIsLoading(true);
    try {
      const data = await exportApi.getAll({
        search: debouncedSearch,
        pageNumber: page,
        pageSize,
      });
      setExports(data.items);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error('Failed to fetch exports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInitialData = async () => {
    try {
      const [wData, pData, uData] = await Promise.all([
        warehouseApi.getAll(),
        productApi.getProducts({ pageSize: 200 }),
        userApi.getAll(),
      ]);
      setWarehouses(wData.items);
      setProducts(pData.items);
      setTechnicians(uData);
      if (wData.items.length > 0 && !selectedWarehouse) setSelectedWarehouse(wData.items[0].id);
      if (uData.length > 0 && !selectedTechnician) setSelectedTechnician(uData[0].id);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  useEffect(() => {
    if (viewMode === 'LIST') {
      fetchExports();
    } else if (viewMode === 'CREATE') {
      fetchInitialData();
    }
  }, [viewMode, debouncedSearch, page, pageSize]);

  const addDetail = () => {
    setDetails([...details, { productId: '', quantity: 1, serialNumbers: [], macAddresses: [] }]);
  };

  const removeDetail = (index: number) => {
    if (details.length > 1) {
      setDetails(details.filter((_, i) => i !== index));
    }
  };

  const updateDetail = (index: number, field: string, value: any) => {
    const newDetails = [...details];
    (newDetails[index] as any)[field] = value;
    
    // Reset serials if product changed
    if (field === 'productId') {
      newDetails[index].serialNumbers = [];
      newDetails[index].macAddresses = [];
    }
    
    setDetails(newDetails);
  };

  const fetchEquipments = async (index: number) => {
    const productId = details[index].productId;
    if (!productId) return;

    setLoadingEquipments(true);
    try {
      // 0 is InStock status
      const data = await equipmentApi.getByProduct(productId, selectedWarehouse, 0);
      setAvailableEquipments(data);
      setActiveDetailIndex(index);
      setIsEquipModalOpen(true);
    } catch (error) {
      alert('Không thể tải danh sách thiết bị. Vui lòng thử lại.');
    } finally {
      setLoadingEquipments(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouse || !selectedTechnician || isSubmitting) return;

    const validDetails = details.filter((d) => d.productId && d.quantity > 0);
    if (validDetails.length === 0) {
      alert('Vui lòng thêm ít nhất một sản phẩm');
      return;
    }

    setIsSubmitting(true);
    try {
      await exportApi.create({
        warehouseId: selectedWarehouse,
        technicianId: selectedTechnician,
        note,
        details: validDetails,
      });
      alert('Xuất kho thành công!');
      setViewMode('LIST');
      setNote('');
      setDetails([{ productId: '', quantity: 1, serialNumbers: [], macAddresses: [] }]);
    } catch (error) {
      console.error('Failed to create export:', error);
      alert('Lỗi khi tạo phiếu xuất kho');
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
            <h1 className="page-title">Lịch sử xuất kho</h1>
            <p className="page-subtitle">Quản lý và xem lại các phiếu xuất hàng ra khỏi kho</p>
          </div>
        </div>
        {hasPermission(PERMISSIONS.Exports.Create) && (
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
        ) : exports.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <TruckIcon size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
            <p>Chưa có phiếu xuất kho nào</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: '24px' }}>Mã phiếu</th>
                    <th>Kho hàng</th>
                    <th>Ngày xuất</th>
                    <th>Kỹ thuật viên</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'right', paddingRight: '24px' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {exports.map((item) => (
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
                          {new Date(item.exportDate).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                          <UserIcon size={14} color="var(--text-muted)" />
                          {item.technicianFullName}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span className={`badge ${item.status === 1 ? 'badge-success' : 'badge-warning'}`}>
                          {item.statusLabel}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <button
                          onClick={() => { setSelectedExport(item); setViewMode('DETAIL'); }}
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
                  Đang xem <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{exports.length}</span> của{' '}
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{totalCount}</span> phiếu
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Hiển thị:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1); }}
                    className="form-input"
                    style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '12px', width: 'auto' }}
                  >
                    {[10, 25, 50, 100].map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  disabled={page === 1}
                  type="button"
                  onClick={() => setPage((p) => p - 1)}
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
                  onClick={() => setPage((p) => p + 1)}
                  className="action-btn"
                  style={{ padding: '8px', borderRadius: '8px', opacity: page * pageSize >= totalCount ? 0.3 : 1 }}
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
          <h1 className="page-title">Tạo phiếu xuất kho</h1>
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
              <Package size={20} color="var(--primary)" /> Danh sách hàng hóa xuất
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {details.map((detail, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 120px 40px', gap: '12px', alignItems: 'end' }}>
                  <div>
                    <label className="form-label">Sản phẩm</label>
                    <select
                      value={detail.productId}
                      onChange={(e) => updateDetail(index, 'productId', e.target.value)}
                      className="form-input"
                      required
                    >
                      <option value="">Chọn sản phẩm...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.productName} (Tồn: {p.quantity} {p.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Số lượng</label>
                    <input
                      type="number"
                      min="1"
                      value={detail.quantity}
                      onChange={(e) => updateDetail(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <button 
                      type="button"
                      onClick={() => fetchEquipments(index)}
                      className="action-btn"
                      style={{ height: '40px', width: '100%', fontSize: '12px', display: 'flex', gap: '4px', border: detail.serialNumbers.length > 0 ? '1px solid #16a34a' : '1px solid var(--border)', color: detail.serialNumbers.length > 0 ? '#16a34a' : 'inherit' }}
                      disabled={!detail.productId}
                    >
                      <Cpu size={14} /> Chọn Serial {detail.serialNumbers.length > 0 && `(${detail.serialNumbers.length})`}
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
                <Plus size={18} /> Thêm vào danh sách
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
                label: "Thêm vào phiếu xuất",
                onClick: handleConfirmAdd
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '0px', alignSelf: 'start' }}>
            <div className="card">
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TruckIcon size={20} color="var(--primary)" /> Thông tin xuất
              </h3>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Kho hàng</label>
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="form-input"
                  required
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.warehouseName}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Kỹ thuật viên nhận hàng</label>
                <select
                  value={selectedTechnician}
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">Chọn kỹ thuật viên...</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>{t.fullName}</option>
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
                  placeholder="Nhập ghi chú phiếu xuất..."
                />
              </div>

              <div style={{ padding: '16px', background: 'var(--primary-lighter)', borderRadius: '12px', marginBottom: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '18px', color: 'var(--primary)' }}>
                  <span>Tổng số mặt hàng:</span>
                  <span>{details.filter((d) => d.productId).length} loại</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  <span>Tổng số lượng:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{details.reduce((s, d) => s + (d.quantity || 0), 0)} sản phẩm</span>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
                style={{ width: '100%', marginTop: '16px', padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                Hoàn thành xuất kho
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Equipment Selection Modal */}
      {isEquipModalOpen && activeDetailIndex !== null && (
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
                  <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>Chọn thiết bị xuất kho</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Đã chọn <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{details[activeDetailIndex].serialNumbers.length}</span> / {details[activeDetailIndex].quantity} thiết bị
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => { setIsEquipModalOpen(false); setActiveDetailIndex(null); }} 
                className="action-btn"
                style={{ background: '#f1f5f9', borderRadius: '12px' }}
              >
                <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>

            <div className="premium-scroll" style={{ maxHeight: '480px', overflowY: 'auto', paddingRight: '8px', padding: '4px' }}>
              {loadingEquipments ? (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                  <Loader2 className="animate-spin" size={48} style={{ margin: '0 auto', color: 'var(--primary)', opacity: 0.5 }} />
                  <p style={{ marginTop: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>Đang tải danh sách thiết bị...</p>
                </div>
              ) : availableEquipments.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', background: 'var(--primary-lighter)', borderRadius: '24px', border: '2px dashed var(--border)' }}>
                  <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
                  <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Không tìm thấy thiết bị nào đang có sẵn trong kho.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                  {availableEquipments.map((eq) => {
                    const isSelected = details[activeDetailIndex].serialNumbers.includes(eq.serialNumber);
                    return (
                      <div 
                        key={eq.id} 
                        className={`slot-card ${isSelected ? 'slot-card-active' : ''}`}
                        onClick={() => {
                          const newSerials = [...details[activeDetailIndex].serialNumbers];
                          const newMacs = [...details[activeDetailIndex].macAddresses];
                          
                          if (isSelected) {
                            const idx = newSerials.indexOf(eq.serialNumber);
                            newSerials.splice(idx, 1);
                            newMacs.splice(idx, 1);
                          } else {
                            if (newSerials.length < details[activeDetailIndex].quantity) {
                              newSerials.push(eq.serialNumber);
                              newMacs.push(eq.macAddress || '');
                            } else {
                              alert(`Bạn chỉ được chọn tối đa ${details[activeDetailIndex].quantity} thiết bị.`);
                              return;
                            }
                          }
                          updateDetail(activeDetailIndex, 'serialNumbers', newSerials);
                          updateDetail(activeDetailIndex, 'macAddresses', newMacs);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ padding: '8px', background: isSelected ? 'var(--primary)' : 'var(--primary-light)', color: isSelected ? 'white' : 'var(--primary)', borderRadius: '10px', transition: 'all 0.3s' }}>
                              <Smartphone size={20} />
                            </div>
                            <span className="slot-badge" style={{ background: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--primary-light)', color: isSelected ? 'white' : 'var(--primary)', marginBottom: 0 }}>
                              {eq.statusLabel}
                            </span>
                          </div>
                          {isSelected && (
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 8px rgba(0, 102, 204, 0.3)' }}>
                              <Check size={14} strokeWidth={4} />
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Hash size={16} color="var(--text-muted)" />
                            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{eq.serialNumber}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Link size={16} color="var(--text-muted)" />
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{eq.macAddress || 'N/A'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                            <Calendar size={14} color="var(--text-muted)" />
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              BH đến: <span style={{ fontWeight: 600 }}>{eq.warrantyExpiry ? new Date(eq.warrantyExpiry).toLocaleDateString('vi-VN') : 'N/A'}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                type="button"
                onClick={() => { setIsEquipModalOpen(false); setActiveDetailIndex(null); }} 
                className="btn-primary" 
                style={{ padding: '10px 32px' }}
              >
                Xác nhận ({details[activeDetailIndex].serialNumbers.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDetailView = () => {
    if (!selectedExport) return null;
    return (
      <div className="animate-fade-in">
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => setViewMode('LIST')} className="action-btn" style={{ width: '40px', height: '40px' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="page-title">Chi tiết phiếu {selectedExport.receiptCode}</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>Danh sách hàng hóa xuất</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {(selectedExport.details ?? []).map((detail: any, idx) => (
                <div key={idx} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{detail.productName}</div>
                    <div style={{ fontWeight: 700 }}>{detail.quantity} {detail.unit}</div>
                  </div>
                  
                  {detail.equipments && detail.equipments.length > 0 && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #e2e8f0' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Cpu size={12} /> Thiết bị đã xuất:
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
              Tổng cộng: {(selectedExport.details ?? []).reduce((s, d) => s + d.quantity, 0)} sản phẩm
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>Thông tin phiếu</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kho xuất</label>
                <div style={{ fontWeight: 600 }}>{selectedExport.warehouseName}</div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Ngày xuất</label>
                <div>{new Date(selectedExport.exportDate).toLocaleString('vi-VN')}</div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kỹ thuật viên</label>
                <div>{selectedExport.technicianFullName}</div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Trạng thái</label>
                <span className={`badge ${selectedExport.status === 1 ? 'badge-success' : 'badge-warning'}`}>
                  {selectedExport.statusLabel}
                </span>
              </div>
              {selectedExport.note && (
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Ghi chú</label>
                  <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{selectedExport.note}</div>
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

export default ExportPage;
