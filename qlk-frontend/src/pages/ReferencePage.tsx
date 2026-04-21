import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Loader2, 
  Hash, 
  Bookmark,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { productApi } from '../api/products';
import type { Category, Brand } from '../types';

import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../api/permissions';

const ReferencePage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'categories' | 'brands'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentItem, setCurrentItem] = useState<{ id?: string, name: string } | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [cats, brs] = await Promise.all([
        productApi.getCategories(),
        productApi.getBrands()
      ]);
      setCategories(cats);
      setBrands(brs);
    } catch (error) {
      console.error('Failed to fetch reference data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (mode: 'create' | 'edit', item?: Category | Brand) => {
    setModalMode(mode);
    if (item) {
      setCurrentItem({ 
        id: item.id, 
        name: activeTab === 'categories' ? (item as Category).categoryName : (item as Brand).brandName 
      });
    } else {
      setCurrentItem({ name: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem?.name.trim()) return;

    setIsSubmitting(true);
    try {
      if (activeTab === 'categories') {
        if (modalMode === 'create') {
          await productApi.createCategory({ categoryName: currentItem.name });
        } else if (currentItem.id) {
          await productApi.updateCategory(currentItem.id, { categoryName: currentItem.name });
        }
      } else {
        if (modalMode === 'create') {
          await productApi.createBrand({ brandName: currentItem.name });
        } else if (currentItem.id) {
          await productApi.updateBrand(currentItem.id, { brandName: currentItem.name });
        }
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Submit failure:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mục này? Thao tác này không thể hoàn tác.')) return;
    
    try {
      if (activeTab === 'categories') {
        await productApi.deleteCategory(id);
      } else {
        await productApi.deleteBrand(id);
      }
      fetchData();
    } catch (error) {
      alert('Không thể xóa. Danh mục/Thương hiệu này có thể đang được sử dụng bởi các sản phẩm.');
    }
  };

  const filteredItems = activeTab === 'categories' 
    ? categories.filter(c => c.categoryName.toLowerCase().includes(searchTerm.toLowerCase()))
    : brands.filter(b => b.brandName.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 className="page-title">Danh mục & Thương hiệu</h1>
        <p className="page-subtitle">Quản lý các thuộc tính phân loại sản phẩm</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '32px' }}>
        <div className="tab-container" style={{ flexDirection: 'column' }}>
          <button 
            onClick={() => { setActiveTab('categories'); setSearchTerm(''); }}
            className={`tab-btn ${activeTab === 'categories' ? 'tab-btn-active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Hash size={20} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>Danh mục</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>{categories.length} phân loại</div>
              </div>
            </div>
            <ChevronRight size={16} />
          </button>

          <button 
            onClick={() => { setActiveTab('brands'); setSearchTerm(''); }}
            className={`tab-btn ${activeTab === 'brands' ? 'tab-btn-active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Bookmark size={20} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>Thương hiệu</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>{brands.length} nhãn hiệu</div>
              </div>
            </div>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Content Area */}
        <div>
          <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div className="search-wrapper" style={{ flex: 1 }}>
                <Search className="search-icon" size={18} />
                <input 
                  type="text" 
                  placeholder={`Tìm kiếm ${activeTab === 'categories' ? 'danh mục' : 'thương hiệu'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '42px' }}
                />
              </div>
              {((activeTab === 'categories' && hasPermission(PERMISSIONS.Categories.Create)) || 
                (activeTab === 'brands' && hasPermission(PERMISSIONS.Brands.Create))) && (
                <button 
                  onClick={() => handleOpenModal('create')}
                  className="btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 24px', borderRadius: '12px' }}
                >
                  <Plus size={18} /> Thêm mới
                </button>
              )}
            </div>

            {isLoading ? (
              <div style={{ padding: '100px 0', textAlign: 'center' }}>
                <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto', color: 'var(--primary)' }} />
              </div>
            ) : filteredItems.length === 0 ? (
              <div style={{ padding: '100px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <AlertCircle size={40} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p>Không tìm thấy mục nào phù hợp.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {filteredItems.map(item => (
                  <div key={item.id} className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div style={{ fontWeight: 600, fontSize: '15px' }}>
                      {activeTab === 'categories' ? (item as Category).categoryName : (item as Brand).brandName}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {((activeTab === 'categories' && hasPermission(PERMISSIONS.Categories.Edit)) || 
                        (activeTab === 'brands' && hasPermission(PERMISSIONS.Brands.Edit))) && (
                        <button 
                          onClick={() => handleOpenModal('edit', item)}
                          className="action-btn"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {((activeTab === 'categories' && hasPermission(PERMISSIONS.Categories.Delete)) || 
                        (activeTab === 'brands' && hasPermission(PERMISSIONS.Brands.Delete))) && (
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="action-btn action-btn-danger"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Basic Modal Implementation */}
      {isModalOpen && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 
        }} onClick={() => setIsModalOpen(false)}>
          <div className="card animate-fade-in" style={{ width: '400px', padding: '32px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px', color: 'var(--text-primary)' }}>
              {modalMode === 'create' ? 'Thêm mới' : 'Chỉnh sửa'} {activeTab === 'categories' ? 'danh mục' : 'thương hiệu'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '24px' }}>
                <label className="form-label">Tên hiển thị</label>
                <input 
                  autoFocus
                  type="text" 
                  value={currentItem?.name}
                  onChange={e => setCurrentItem(prev => ({ ...prev!, name: e.target.value }))}
                  className="form-input"
                  placeholder="Nhập tên..."
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="action-btn" style={{ padding: '10px 20px', fontWeight: 600 }}>Hủy</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ padding: '10px 24px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferencePage;
