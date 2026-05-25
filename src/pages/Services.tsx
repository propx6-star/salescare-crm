import { useState } from 'react';
import { Plus, Search, Edit2, CheckCircle2, AlertTriangle, Filter } from 'lucide-react';
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase';
import { useAuthStore } from '../store/authStore';

export default function Services() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  
  const user = useAuthStore(state => state.user);
  const effectiveShopId = user?.role === 'SUPER_ADMIN' ? (user?.shop_id || 1) : user?.shop_id;

  const { data: allServices = [], loading, refetch } = useSupabaseQuery<any>({
    table: 'services',
    eq: effectiveShopId ? { shop_id: effectiveShopId } : undefined,
    order: { column: 'name', ascending: true }
  });

  const services = allServices.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (service.code && service.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Dịch vụ</h1>
          <p className="text-slate-500 mt-1">Cài đặt danh sách dịch vụ và giá mặc định</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => {
              setEditingService(null);
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Thêm dịch vụ
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm theo tên hoặc mã dịch vụ..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-sm text-slate-500">
                <th className="p-4 font-medium">Tên Dịch vụ</th>
                <th className="p-4 font-medium">Mã</th>
                <th className="p-4 font-medium">Danh mục</th>
                <th className="p-4 font-medium text-right">Giá mặc định</th>
                <th className="p-4 font-medium text-center">Thời gian (phút)</th>
                <th className="p-4 font-medium text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Đang tải dữ liệu dịch vụ...
                  </td>
                </tr>
              )}
              {!loading && services.map(service => (
                <tr 
                  key={service.id} 
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer" 
                  onClick={() => {
                    setEditingService(service);
                    setIsModalOpen(true);
                  }}
                >
                  <td className="p-4">
                    <div className="font-semibold text-slate-800">{service.name}</div>
                    {service.note && <div className="text-sm text-slate-500 line-clamp-1">{service.note}</div>}
                  </td>
                  <td className="p-4 text-slate-600 font-medium">{service.code || '-'}</td>
                  <td className="p-4 text-slate-600">{service.category || '-'}</td>
                  <td className="p-4 text-right font-medium text-slate-700">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price)}
                  </td>
                  <td className="p-4 text-center text-slate-600">{service.duration_minutes}</td>
                  <td className="p-4 text-center">
                    {service.status === 'active' ? (
                      <span className="bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Đang mở</span>
                    ) : (
                      <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Ngừng bán</span>
                    )}
                  </td>
                </tr>
              ))}
              
              {!loading && services.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Không tìm thấy dịch vụ nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ServiceFormModal 
          service={editingService}
          onClose={() => {
            setIsModalOpen(false);
            setEditingService(null);
          }} 
          onSuccess={() => refetch()} 
        />
      )}
    </div>
  );
}

function ServiceFormModal({ service, onClose, onSuccess }: { service?: any, onClose: () => void, onSuccess: () => void }) {
  const user = useAuthStore(state => state.user);
  const effectiveShopId = user?.role === 'SUPER_ADMIN' ? (user?.shop_id || 1) : user?.shop_id;
  
  const serviceMutation = useSupabaseMutation('services');
  
  const [formData, setFormData] = useState({
    name: service?.name || '',
    code: service?.code || '',
    category: service?.category || '',
    price: service?.price || 0,
    duration_minutes: service?.duration_minutes || 60,
    status: service?.status || 'active',
    note: service?.note || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert("Vui lòng nhập tên dịch vụ!");
    
    setIsSubmitting(true);
    try {
      if (service?.id) {
        await serviceMutation.update(service.id, {
          ...formData,
          updated_at: new Date().toISOString()
        });
      } else {
        await serviceMutation.insert({
          shop_id: effectiveShopId,
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra khi lưu!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!service?.id) return;
    if (confirm("Bạn có chắc chắn muốn xóa dịch vụ này? Hành động này không thể hoàn tác.")) {
      setIsSubmitting(true);
      try {
        await serviceMutation.delete(service.id);
        onSuccess();
        onClose();
      } catch (error) {
        console.error(error);
        alert("Có lỗi xảy ra khi xóa!");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {service ? 'Sửa thông tin dịch vụ' : 'Thêm dịch vụ mới'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Tên dịch vụ *</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mã (Code)</label>
              <input 
                type="text" 
                value={formData.code}
                onChange={e => setFormData({...formData, code: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phân loại (Category)</label>
              <input 
                type="text" 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="VD: Laser, Facial..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Giá mặc định (VNĐ)</label>
              <input 
                type="number" 
                value={formData.price}
                onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Thời gian làm (Phút)</label>
              <input 
                type="number" 
                value={formData.duration_minutes}
                onChange={e => setFormData({...formData, duration_minutes: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
              <select 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Đang mở</option>
                <option value="inactive">Ngừng bán</option>
              </select>
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
            {service ? (
              <button 
                type="button" 
                onClick={handleDelete}
                disabled={isSubmitting}
                className="text-red-600 hover:text-red-700 font-medium text-sm px-3 py-2 hover:bg-red-50 rounded-lg transition-colors"
              >
                Xóa dịch vụ
              </button>
            ) : <div></div>}
            
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
              >
                Hủy
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Đang lưu...' : 'Lưu dịch vụ'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
