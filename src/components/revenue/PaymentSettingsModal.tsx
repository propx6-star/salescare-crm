import { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabase';
import { useAuthStore } from '../../store/authStore';

export default function PaymentSettingsModal({ onClose }: { onClose: () => void }) {
  const user = useAuthStore(state => state.user);
  
  // Lấy shop_id thực tế (nếu SUPER_ADMIN thì có thể phải chọn shop, tạm thời lấy shop đầu tiên hoặc null)
  const effectiveShopId = user?.role === 'SUPER_ADMIN' ? (user?.shop_id || 1) : user?.shop_id;

  const { data: shopSettings = [], loading } = useSupabaseQuery<any>({ 
    table: 'shop_settings', 
    eq: effectiveShopId ? { shop_id: effectiveShopId } : undefined 
  });
  const settingsMutation = useSupabaseMutation('shop_settings');

  const [formData, setFormData] = useState({
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
    qr_code_url: ''
  });

  useEffect(() => {
    if (shopSettings.length > 0) {
      const s = shopSettings[0];
      setFormData({
        bank_name: s.bank_name || '',
        bank_account_number: s.bank_account_number || '',
        bank_account_name: s.bank_account_name || '',
        qr_code_url: s.qr_code_url || ''
      });
    }
  }, [shopSettings]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Vui lòng chọn ảnh nhỏ hơn 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, qr_code_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveShopId) return alert("Không tìm thấy Shop ID");

    try {
      if (shopSettings.length > 0) {
        await settingsMutation.update(shopSettings[0].id, {
          ...formData,
          updated_at: new Date().toISOString()
        });
      } else {
        await settingsMutation.insert({
          shop_id: effectiveShopId,
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      alert("Đã lưu thông tin thanh toán!");
      onClose();
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra khi lưu!");
    }
  };

  if (loading) return <div className="p-8 text-center bg-white rounded-xl">Đang tải...</div>;

  return (
    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
      <div className="flex justify-between items-center p-6 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Cài đặt Thanh toán & QR Code</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSave} className="p-6 space-y-5">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên Ngân hàng</label>
            <input 
              type="text" 
              placeholder="VD: Vietcombank, MB Bank..."
              value={formData.bank_name}
              onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Số Tài khoản</label>
            <input 
              type="text" 
              placeholder="VD: 1903..."
              value={formData.bank_account_number}
              onChange={(e) => setFormData({...formData, bank_account_number: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên Chủ Tài khoản</label>
            <input 
              type="text" 
              placeholder="VD: NGUYEN VAN A"
              value={formData.bank_account_name}
              onChange={(e) => setFormData({...formData, bank_account_name: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Ảnh mã QR (Base64)</label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors relative overflow-hidden">
              {formData.qr_code_url ? (
                <>
                  <img src={formData.qr_code_url} alt="QR Code Preview" className="mx-auto h-40 object-contain rounded" />
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, qr_code_url: ''})}
                    className="absolute top-2 right-2 bg-red-100 text-red-600 p-1.5 rounded-full"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <label className="cursor-pointer block py-4">
                  <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <span className="text-sm font-medium text-blue-600">Bấm để tải ảnh QR lên</span>
                  <p className="text-xs text-slate-500 mt-1">Hỗ trợ JPG, PNG (Max 2MB)</p>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium">Hủy</button>
          <button type="submit" className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow-sm">
            <Save className="w-4 h-4" />
            Lưu cài đặt
          </button>
        </div>
      </form>
    </div>
  );
}
