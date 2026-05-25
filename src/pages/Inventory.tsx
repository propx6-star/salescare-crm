import { useState } from 'react';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { Package, Search, Plus, Filter, AlertTriangle, Download } from 'lucide-react';
import { format } from 'date-fns';
import ProductFormModal from '../components/inventory/ProductFormModal';
import { useAuthStore } from '../store/authStore';

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  const { data: allProducts = [], loading, refetch } = useSupabaseQuery<any>({
    table: 'products',
    order: { column: 'created_at', ascending: false }
  });
  
  const products = allProducts.filter((p: any) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    if (products.length === 0) return alert('Không có dữ liệu để xuất');
    
    const headers = ['SKU', 'Tên sản phẩm', 'Danh mục', 'Thương hiệu', 'Tồn kho', 'Giá bán', 'Trạng thái'];
    const rows = products.map((p: any) => [
      p.sku,
      p.name,
      p.category || '',
      p.brand || '',
      p.stock_quantity,
      p.selling_price,
      p.stock_quantity === 0 ? 'Hết hàng' : (p.stock_quantity <= p.low_stock_threshold ? 'Sắp hết' : 'Còn hàng')
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kho_hang_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Kho hàng</h1>
        <div className="flex gap-2">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Download className="w-5 h-5" />
            Xuất CSV
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Thêm sản phẩm
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-slate-500 font-medium">Tổng sản phẩm</div>
            <div className="text-2xl font-bold text-slate-800">{allProducts.length}</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-slate-500 font-medium">Sắp hết hàng</div>
            <div className="text-2xl font-bold text-slate-800">
              {allProducts.filter(p => p.stock_quantity <= p.low_stock_threshold).length}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 flex flex-col sm:flex-row gap-3 border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm theo tên hoặc mã SKU..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium">
          <Filter className="w-4 h-4" />
          Lọc
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-sm text-slate-500">
                <th className="p-4 font-medium">Sản phẩm</th>
                <th className="p-4 font-medium">SKU</th>
                <th className="p-4 font-medium text-right">Tồn kho</th>
                <th className="p-4 font-medium text-right hidden sm:table-cell">Giá bán</th>
                <th className="p-4 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Đang tải dữ liệu sản phẩm từ đám mây...
                  </td>
                </tr>
              )}
              {!loading && products.map(product => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setEditingProduct(product)}>
                  <td className="p-4">
                    <div className="font-semibold text-slate-800">{product.name}</div>
                    <div className="text-sm text-slate-500">{product.category} • {product.brand}</div>
                  </td>
                  <td className="p-4 text-slate-600 font-medium">{product.sku}</td>
                  <td className="p-4 text-right">
                    <div className="font-bold text-slate-800">{product.stock_quantity}</div>
                    <div className="text-xs text-slate-500">{product.unit}</div>
                  </td>
                  <td className="p-4 text-right hidden sm:table-cell font-medium text-slate-700">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.selling_price)}
                  </td>
                  <td className="p-4">
                    {product.stock_quantity === 0 ? (
                      <span className="bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-xs font-medium">Hết hàng</span>
                    ) : product.stock_quantity <= product.low_stock_threshold ? (
                      <span className="bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full text-xs font-medium">Sắp hết</span>
                    ) : (
                      <span className="bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full text-xs font-medium">Còn hàng</span>
                    )}
                  </td>
                </tr>
              ))}
              
              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Không tìm thấy sản phẩm nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(isModalOpen || editingProduct) && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95">
            <ProductFormModal 
              onClose={() => {
                setIsModalOpen(false);
                setEditingProduct(null);
              }} 
              onSuccess={() => refetch()} 
              product={editingProduct}
            />
          </div>
        </div>
      )}
    </div>
  );
}
