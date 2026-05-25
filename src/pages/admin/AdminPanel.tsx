import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabase';
import { Store, Users, DollarSign, Activity, Plus, Shield, Building2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPanel() {
  const user = useAuthStore(state => state.user);
  const [activeTab, setActiveTab] = useState<'overview' | 'shops' | 'users'>('overview');
  
  const { data: shops = [], loading: shopsLoading, refetch: refetchShops } = useSupabaseQuery<any>({ table: 'shops' });
  const { data: profiles = [], loading: profilesLoading, refetch: refetchProfiles } = useSupabaseQuery<any>({ table: 'user_profiles' });
  
  const shopMutation = useSupabaseMutation('shops');
  const profileMutation = useSupabaseMutation('user_profiles');
  
  const [newShop, setNewShop] = useState({ name: '', address: '', phone: '', type: 'Spa', shop_code: '' });
  const [isCreatingShop, setIsCreatingShop] = useState(false);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserShopId, setEditUserShopId] = useState<string>('');
  const [editUserRole, setEditUserRole] = useState<string>('');

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Shield className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Không có quyền truy cập</h2>
        <p>Trang này chỉ dành cho Quản trị viên hệ thống (SUPER_ADMIN).</p>
      </div>
    );
  }

  const handleCreateShop = async () => {
    if (!newShop.name || !newShop.shop_code) return alert('Vui lòng nhập Tên và Mã Chi nhánh');
    try {
      await shopMutation.insert(newShop);
      setNewShop({ name: '', address: '', phone: '', type: 'Spa', shop_code: '' });
      setIsCreatingShop(false);
      refetchShops();
      alert('Tạo chi nhánh thành công!');
    } catch (error: any) {
      alert(`Lỗi tạo chi nhánh: ${error.message}`);
    }
  };

  const handleSaveUser = async (id: string) => {
    try {
      await profileMutation.update(id, {
        shop_id: editUserShopId ? Number(editUserShopId) : null,
        role: editUserRole
      });
      setEditingUserId(null);
      refetchProfiles();
      alert('Cập nhật quyền thành công!');
    } catch (error: any) {
      alert(`Lỗi cập nhật: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Quản trị Hệ thống Toàn cục</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors relative ${
              activeTab === 'overview' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Tổng quan
            {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
          </button>
          <button
            onClick={() => setActiveTab('shops')}
            className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors relative ${
              activeTab === 'shops' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Quản lý Chi nhánh
            {activeTab === 'shops' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors relative ${
              activeTab === 'users' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Quản lý Tài khoản (Phân quyền)
            {activeTab === 'users' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm text-slate-500 font-medium">Tổng số Chi nhánh</div>
                  <div className="text-2xl font-bold text-slate-800">{shops.length}</div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm text-slate-500 font-medium">Tổng tài khoản hệ thống</div>
                  <div className="text-2xl font-bold text-slate-800">{profiles.length}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shops' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-800">Danh sách Chi nhánh</h3>
                <button 
                  onClick={() => setIsCreatingShop(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Tạo Chi nhánh mới
                </button>
              </div>

              {isCreatingShop && (
                <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="md:col-span-2 lg:col-span-3">
                    <h4 className="font-semibold text-blue-800 mb-2">Thông tin chi nhánh mới</h4>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mã Shop (VD: SHOP03) *</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                      value={newShop.shop_code}
                      onChange={e => setNewShop({...newShop, shop_code: e.target.value.toUpperCase()})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tên Chi nhánh *</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                      value={newShop.name}
                      onChange={e => setNewShop({...newShop, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Loại hình kinh doanh</label>
                    <select 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={newShop.type}
                      onChange={e => setNewShop({...newShop, type: e.target.value})}
                    >
                      <option value="Spa">Spa</option>
                      <option value="Thẩm mỹ viện">Thẩm mỹ viện</option>
                      <option value="Phòng khám">Phòng khám</option>
                      <option value="Salon tóc">Salon tóc</option>
                      <option value="Nail & Mi">Nail & Mi</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                      value={newShop.address}
                      onChange={e => setNewShop({...newShop, address: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                      value={newShop.phone}
                      onChange={e => setNewShop({...newShop, phone: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-2 mt-2">
                    <button onClick={() => setIsCreatingShop(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 bg-white hover:bg-slate-50">Hủy</button>
                    <button onClick={handleCreateShop} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Lưu Chi nhánh</button>
                  </div>
                </div>
              )}

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-4 font-medium text-slate-500">Mã Shop</th>
                      <th className="p-4 font-medium text-slate-500">Tên Shop</th>
                      <th className="p-4 font-medium text-slate-500">Loại hình</th>
                      <th className="p-4 font-medium text-slate-500">SĐT</th>
                      <th className="p-4 font-medium text-slate-500">Địa chỉ</th>
                      <th className="p-4 font-medium text-slate-500">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {shopsLoading ? <tr><td colSpan={6} className="p-4 text-center">Đang tải...</td></tr> : 
                      shops.map((shop: any) => (
                        <tr key={shop.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-medium text-blue-600">{shop.shop_code}</td>
                          <td className="p-4 font-semibold text-slate-800">{shop.name}</td>
                          <td className="p-4 text-slate-600">{shop.type}</td>
                          <td className="p-4 text-slate-600">{shop.phone || '-'}</td>
                          <td className="p-4 text-slate-600">{shop.address || '-'}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                              {shop.status || 'Hoạt động'}
                            </span>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-800">Cấp quyền Tài khoản</h3>
                <p className="text-sm text-slate-500 bg-blue-50 px-3 py-1 rounded text-blue-800 font-medium">Lưu ý: Quản trị viên chỉ có thể chỉ định tài khoản vào các Chi nhánh nhất định.</p>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-4 font-medium text-slate-500">Tên / Email</th>
                      <th className="p-4 font-medium text-slate-500">Vai trò</th>
                      <th className="p-4 font-medium text-slate-500">Trực thuộc Chi nhánh</th>
                      <th className="p-4 font-medium text-slate-500">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {profilesLoading ? <tr><td colSpan={4} className="p-4 text-center">Đang tải...</td></tr> :
                      profiles.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="p-4">
                            <div className="font-semibold text-slate-800">{p.name || 'Chưa có tên'}</div>
                            <div className="text-sm text-slate-500">{p.email}</div>
                          </td>
                          <td className="p-4">
                            {editingUserId === p.id ? (
                              <select 
                                value={editUserRole}
                                onChange={e => setEditUserRole(e.target.value)}
                                className="w-full px-2 py-1 border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm font-semibold"
                              >
                                <option value="SUPER_ADMIN">SUPER_ADMIN (Quản trị toàn cục)</option>
                                <option value="SHOP_OWNER">SHOP_OWNER (Chủ chi nhánh)</option>
                                <option value="STAFF">STAFF (Nhân viên)</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                p.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' : 
                                p.role === 'SHOP_OWNER' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {p.role || 'STAFF'}
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            {editingUserId === p.id ? (
                              <select 
                                value={editUserShopId}
                                onChange={e => setEditUserShopId(e.target.value)}
                                className="w-full px-2 py-1 border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                              >
                                <option value="">-- KHÔNG CÓ (Toàn hệ thống) --</option>
                                {shops.map((s: any) => (
                                  <option key={s.id} value={s.id}>{s.shop_code} - {s.name}</option>
                                ))}
                              </select>
                            ) : (
                              p.shop_id ? (
                                <span className="flex items-center gap-1 font-medium text-slate-700">
                                  <Building2 className="w-4 h-4 text-slate-400" />
                                  {shops.find((s: any) => s.id === p.shop_id)?.name || `Shop ID: ${p.shop_id}`}
                                </span>
                              ) : (
                                <span className="text-red-500 italic text-sm">Chưa phân bổ / Toàn quyền</span>
                              )
                            )}
                          </td>
                          <td className="p-4">
                            {editingUserId === p.id ? (
                              <div className="flex gap-2">
                                <button onClick={() => handleSaveUser(p.id)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Lưu</button>
                                <button onClick={() => setEditingUserId(null)} className="px-3 py-1 bg-slate-200 text-slate-700 rounded text-sm hover:bg-slate-300">Hủy</button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => {
                                  setEditingUserId(p.id);
                                  setEditUserRole(p.role || 'STAFF');
                                  setEditUserShopId(p.shop_id ? String(p.shop_id) : '');
                                }} 
                                className="px-3 py-1 border border-slate-300 text-slate-600 rounded text-sm hover:bg-slate-50 transition-colors"
                              >
                                Sửa quyền
                              </button>
                            )}
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
