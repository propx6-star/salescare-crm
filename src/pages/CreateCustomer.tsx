import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseMutation, useSupabaseQuery } from '../hooks/useSupabase';
import { ArrowLeft, Save, UserPlus, Building2 } from 'lucide-react';
import { format } from 'date-fns';

import { useAuthStore } from '../store/authStore';

export default function CreateCustomer() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    source: 'Facebook',
    lead_temperature: 'Ấm',
    status: 'Khách mới',
    note: ''
  });
  const [selectedShopId, setSelectedShopId] = useState('');

  const { data: shops = [] } = useSupabaseQuery<any>({ table: 'shops' });
  const customerMutation = useSupabaseMutation('customers');

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      alert('Vui lòng nhập tên và số điện thoại');
      return;
    }

    if (user?.role === 'SUPER_ADMIN' && !selectedShopId) {
      alert('Vui lòng chọn cửa hàng!');
      return;
    }
    
    if (!user?.shop_id && user?.role !== 'SUPER_ADMIN') {
      alert('Không xác định được cửa hàng hiện tại!');
      return;
    }

    try {
      const now = new Date().toISOString();
      const newCustomer = await customerMutation.insert({
        ...formData,
        shop_id: user?.role === 'SUPER_ADMIN' ? (selectedShopId ? Number(selectedShopId) : null) : (user?.shop_id ? Number(user.shop_id) : null),
        tags: [],
        assigned_to: user?.id,
        start_date: format(new Date(), 'yyyy-MM-dd'),
        created_at: now,
        updated_at: now,
      });
      navigate(`/customers/${newCustomer.id}`);
    } catch (error: any) {
      console.error(error);
      alert('Lỗi tạo khách hàng: ' + (error.message || JSON.stringify(error)));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Thêm khách hàng mới</h1>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm"
        >
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">Lưu</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 sm:p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-800">Thông tin cơ bản</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên *</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Nguyễn Văn A" 
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại *</label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="09..." 
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nguồn khách</label>
              <select 
                value={formData.source}
                onChange={e => setFormData({...formData, source: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="Facebook">Facebook</option>
                <option value="Zalo">Zalo</option>
                <option value="TikTok">TikTok</option>
                <option value="Website">Website</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mức độ quan tâm</label>
              <select 
                value={formData.lead_temperature}
                onChange={e => setFormData({...formData, lead_temperature: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="Nóng">Nóng</option>
                <option value="Ấm">Ấm</option>
                <option value="Lạnh">Lạnh</option>
              </select>
            </div>
            
            {user?.role === 'SUPER_ADMIN' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Building2 className="w-4 h-4" /> 
                  Gán vào Cửa hàng (Chỉ dành cho Admin) *
                </label>
                <select 
                  value={selectedShopId}
                  onChange={e => setSelectedShopId(e.target.value)}
                  className="w-full px-3 py-2 bg-yellow-50 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold"
                >
                  <option value="">-- Chọn cửa hàng --</option>
                  {shops.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
            <textarea 
              rows={3}
              value={formData.note}
              onChange={e => setFormData({...formData, note: e.target.value})}
              placeholder="Thông tin thêm về khách hàng..." 
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" 
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}
