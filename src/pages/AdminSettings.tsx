import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase';
import { Store, Shield, Activity, Users, Plus, Building2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminSettings() {
  const user = useAuthStore(state => state.user);
  const [activeTab, setActiveTab] = useState<'shops' | 'users' | 'logs'>('shops');
  
  const { data: shops = [], loading: shopsLoading, refetch: refetchShops } = useSupabaseQuery<any>({ table: 'shops' });
  const { data: profiles = [], loading: profilesLoading } = useSupabaseQuery<any>({ table: 'user_profiles' });
  const shopMutation = useSupabaseMutation('shops');
  
  const [newShop, setNewShop] = useState({ name: '', address: '' });
  const [isCreatingShop, setIsCreatingShop] = useState(false);

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Shield className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Không có quyền truy cập</h2>
        <p>Trang này chỉ dành cho Quản trị viên hệ thống.</p>
      </div>
    );
  }

  const handleCreateShop = async () => {
    if (!newShop.name) return;
    try {
      await shopMutation.insert(newShop);
      setNewShop({ name: '', address: '' });
      setIsCreatingShop(false);
      refetchShops();
      alert('Tạo chi nhánh thành công!');
    } catch (error) {
      alert('Lỗi tạo chi nhánh');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Quản trị hệ thống</h1>
        <p className="text-slate-500 mt-1">Quản lý chi nhánh, nhân sự và theo dõi hệ thống</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('shops')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 font-medium transition-colors ${
              activeTab === 'shops' ? 'bg-blue-50/50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-5 h-5" />
            Quản lý Chi nhánh
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 font-medium transition-colors ${
              activeTab === 'users' ? 'bg-blue-50/50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Users className="w-5 h-5" />
            Tài khoản Toàn hệ thống
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'shops' ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-slate-800 text-lg">Danh sách Chi nhánh</h3>
                <button 
                  onClick={() => setIsCreatingShop(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Tạo Chi nhánh mới
                </button>
              </div>
              
              {isCreatingShop && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tên chi nhánh</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                      placeholder="VD: Chi nhánh Hà Nội"
                      value={newShop.name}
                      onChange={e => setNewShop({...newShop, name: e.target.value})}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                      placeholder="VD: 123 Đường X"
                      value={newShop.address}
                      onChange={e => setNewShop({...newShop, address: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setIsCreatingShop(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 bg-white hover:bg-slate-50">Hủy</button>
                    <button onClick={handleCreateShop} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Lưu lại</button>
                  </div>
                </div>
              )}

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="p-3 font-medium">Tên Chi nhánh</th>
                      <th className="p-3 font-medium">Địa chỉ</th>
                      <th className="p-3 font-medium">Trạng thái</th>
                      <th className="p-3 font-medium">Ngày tạo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {shopsLoading ? <tr><td colSpan={4} className="p-4 text-center">Đang tải...</td></tr> : 
                      shops.map((s: any) => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-800 flex items-center gap-2">
                            <Store className="w-4 h-4 text-blue-500" />
                            {s.name}
                          </td>
                          <td className="p-3 text-slate-600">{s.address || 'Chưa cập nhật'}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-green-100 text-green-700">
                              {s.subscription_status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500">{format(new Date(s.created_at), 'dd/MM/yyyy')}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-slate-800 text-lg">Tài khoản Toàn hệ thống</h3>
                <p className="text-sm text-slate-500">Lưu ý: Quản trị viên chỉ có thể xem hồ sơ. Việc gán nhân sự do Chủ shop thực hiện.</p>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="p-3 font-medium">Họ tên</th>
                      <th className="p-3 font-medium">Email</th>
                      <th className="p-3 font-medium">Vai trò</th>
                      <th className="p-3 font-medium">Cửa hàng (Chi nhánh)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {profilesLoading ? <tr><td colSpan={4} className="p-4 text-center">Đang tải...</td></tr> :
                      profiles.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="p-3 font-medium text-slate-800">{p.name || 'Chưa cập nhật'}</td>
                          <td className="p-3 text-slate-600">{p.email}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                              p.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {p.role}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500">
                            {shops.find((s: any) => s.id === p.shop_id)?.name || <span className="text-red-400 italic">Chưa phân bổ</span>}
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
