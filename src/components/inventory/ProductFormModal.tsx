import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useSupabaseMutation } from '../../hooks/useSupabase';
import { useAuthStore } from '../../store/authStore';

interface ProductFormModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  // If product is provided, we edit it, otherwise create new
  product?: any;
}

export default function ProductFormModal({ onClose, onSuccess, product }: ProductFormModalProps) {
  const user = useAuthStore(state => state.user);
  const productMutation = useSupabaseMutation('products');

  const [formData, setFormData] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    brand: product?.brand || '',
    category: product?.category || 'Mỹ phẩm',
    stock_quantity: product?.stock_quantity || 0,
    low_stock_threshold: product?.low_stock_threshold || 5,
    unit: product?.unit || 'Chai',
    import_price: product?.import_price || 0,
    selling_price: product?.selling_price || 0,
    supplier: product?.supplier || '',
    repurchase_cycle_days: product?.repurchase_cycle_days || 30,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) return alert('Vui lòng nhập tên và mã SKU');

    const now = new Date().toISOString();
    
    try {
      const status = formData.stock_quantity > formData.low_stock_threshold ? 'Còn hàng' : (formData.stock_quantity === 0 ? 'Hết hàng' : 'Sắp hết');
      if (product?.id) {
        // Edit mode
        await productMutation.update(product.id, {
          ...formData,
          status,
          updated_at: now
        });
      } else {
        // Create mode
        await productMutation.insert({
          ...formData,
          shop_id: user?.shop_id || null,
          status,
          created_at: now,
          updated_at: now
        });
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Lỗi khi lưu sản phẩm:', error);
      alert('Đã xảy ra lỗi, vui lòng thử lại');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {product ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên sản phẩm *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: Serum phục hồi B5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mã SKU *</label>
                <input 
                  type="text" 
                  required
                  value={formData.sku}
                  onChange={e => setFormData({...formData, sku: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: SRM-B5-01"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Thương hiệu</label>
                  <input 
                    type="text" 
                    value={formData.brand}
                    onChange={e => setFormData({...formData, brand: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Mỹ phẩm">Mỹ phẩm</option>
                    <option value="Dược mỹ phẩm">Dược mỹ phẩm</option>
                    <option value="Dụng cụ">Dụng cụ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nhà cung cấp</label>
                <input 
                  type="text" 
                  value={formData.supplier}
                  onChange={e => setFormData({...formData, supplier: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Giá nhập</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.import_price}
                    onChange={e => setFormData({...formData, import_price: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Giá bán *</label>
                  <input 
                    type="number" 
                    min="0" required
                    value={formData.selling_price}
                    onChange={e => setFormData({...formData, selling_price: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng tồn kho</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.stock_quantity}
                    onChange={e => setFormData({...formData, stock_quantity: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  />
                  <p className="text-xs text-slate-500 mt-1">Chỉnh sửa ở đây không tạo phiếu kiểm kê.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị tính</label>
                  <input 
                    type="text" 
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: Chai, Tuýp"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngưỡng báo hết hàng</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.low_stock_threshold}
                    onChange={e => setFormData({...formData, low_stock_threshold: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Chu kỳ mua lại (Ngày)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.repurchase_cycle_days}
                    onChange={e => setFormData({...formData, repurchase_cycle_days: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
            >
              Hủy
            </button>
            <button 
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              Lưu sản phẩm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
