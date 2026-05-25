import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { db } from '../../db/db';
import { Save, Store, Package, Settings, Users, AlertCircle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';

export default function ShopSettings() {
  const user = useAuthStore(state => state.user);
  const shopId = user?.shop_id;
  
  const shop = useLiveQuery(() => shopId ? db.shops.get(shopId) : undefined, [shopId]);
  const settings = useLiveQuery(() => shopId ? db.shop_settings.where('shop_id').equals(shopId).first() : undefined, [shopId]);

  const [form, setForm] = useState({
    invoice_prefix: 'HD-',
    auto_generate_invoice_code: true,
    allow_negative_stock: false,
    deduct_stock_on_invoice_save: true,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        invoice_prefix: settings.invoice_prefix,
        auto_generate_invoice_code: settings.auto_generate_invoice_code,
        allow_negative_stock: settings.allow_negative_stock,
        deduct_stock_on_invoice_save: settings.deduct_stock_on_invoice_save,
      });
    }
  }, [settings]);

  const [activeTab, setActiveTab] = useState('general');

  const handleSaveSettings = async () => {
    if (!shopId || !settings) return;
    await db.shop_settings.update(settings.id!, {
      ...form,
      updated_at: new Date().toISOString()
    });
    alert('Đã lưu cấu hình thành công!');
  };

  if (!shopId) return <div className="p-4 text-center text-slate-500">Vui lòng đăng nhập với tài khoản có Shop</div>;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Cài đặt Cửa hàng</h1>
        <button 
          onClick={handleSaveSettings}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          Lưu thay đổi
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors relative flex items-center gap-2 ${
              activeTab === 'general' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Store className="w-4 h-4" />
            Thông tin chung
            {activeTab === 'general' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
          </button>
          <button
            onClick={() => setActiveTab('invoice_stock')}
            className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors relative flex items-center gap-2 ${
              activeTab === 'invoice_stock' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Package className="w-4 h-4" />
            Hóa đơn & Kho hàng
            {activeTab === 'invoice_stock' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors relative flex items-center gap-2 ${
              activeTab === 'staff' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Quản lý Nhân viên
            {activeTab === 'staff' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'general' && (
            <div className="max-w-2xl space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên Chi nhánh/Cửa hàng</label>
                <input type="text" value={shop?.name || ''} disabled className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mã Shop</label>
                  <input type="text" value={shop?.shop_code || ''} disabled className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Loại hình</label>
                  <input type="text" value={shop?.type || ''} disabled className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500" />
                </div>
              </div>
              <div className="bg-amber-50 text-amber-700 p-3 rounded-lg flex gap-2 items-start border border-amber-100 mt-4">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">Thông tin cơ bản của cửa hàng được quản lý bởi Super Admin. Vui lòng liên hệ Admin nếu cần thay đổi.</p>
              </div>
            </div>
          )}

          {activeTab === 'invoice_stock' && (
            <div className="max-w-2xl space-y-6">
              <h3 className="text-lg font-semibold text-slate-800">Cấu hình Hóa đơn</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tiền tố mã hóa đơn (VD: HD-)</label>
                  <input 
                    type="text" 
                    value={form.invoice_prefix} 
                    onChange={e => setForm({...form, invoice_prefix: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="form-checkbox h-5 w-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
                      checked={form.auto_generate_invoice_code}
                      onChange={e => setForm({...form, auto_generate_invoice_code: e.target.checked})}
                    />
                    <span className="ml-2 text-slate-700">Tự động sinh mã hóa đơn</span>
                  </label>
                </div>
              </div>

              <div className="h-px bg-slate-200 my-6"></div>

              <h3 className="text-lg font-semibold text-slate-800">Tự động hóa Kho hàng</h3>
              <div className="space-y-4">
                <label className="flex items-start p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <input 
                    type="checkbox" 
                    className="form-checkbox h-5 w-5 mt-0.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
                    checked={form.deduct_stock_on_invoice_save}
                    onChange={e => setForm({...form, deduct_stock_on_invoice_save: e.target.checked})}
                  />
                  <div className="ml-3">
                    <span className="block font-medium text-slate-800">Tự động trừ kho khi lưu hóa đơn</span>
                    <span className="block text-sm text-slate-500 mt-1">Khi nhân viên bấm lưu hóa đơn, hệ thống sẽ tự động trừ số lượng sản phẩm trong kho.</span>
                  </div>
                </label>

                <label className="flex items-start p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <input 
                    type="checkbox" 
                    className="form-checkbox h-5 w-5 mt-0.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
                    checked={form.allow_negative_stock}
                    onChange={e => setForm({...form, allow_negative_stock: e.target.checked})}
                  />
                  <div className="ml-3">
                    <span className="block font-medium text-slate-800">Cho phép bán âm kho</span>
                    <span className="block text-sm text-slate-500 mt-1">Cho phép lên hóa đơn và xuất hàng ngay cả khi số lượng tồn kho trên hệ thống bằng 0 hoặc không đủ. Kho sẽ bị âm.</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Nhân viên Cửa hàng</h3>
                <button className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100">
                  + Thêm nhân viên
                </button>
              </div>
              <div className="text-center p-8 border border-slate-200 rounded-lg border-dashed">
                <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500">Chưa có dữ liệu nhân viên. Bạn có thể thêm nhân viên mới thuộc cửa hàng này.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
