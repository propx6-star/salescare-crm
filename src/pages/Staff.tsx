import { useSupabaseQuery } from '../hooks/useSupabase';
import { useAuthStore } from '../store/authStore';
import { UserCog, Plus, ShieldAlert } from 'lucide-react';

export default function Staff() {
  const user = useAuthStore(state => state.user);

  const { data: staffList = [], loading } = useSupabaseQuery<any>({
    table: 'user_profiles',
    order: { column: 'created_at', ascending: false }
  });

  if (!user || (user.role !== 'SHOP_OWNER' && user.role !== 'SUPER_ADMIN')) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center text-slate-500">
        <ShieldAlert className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Không có quyền truy cập</h2>
        <p>Bạn không có quyền xem danh sách nhân sự của chi nhánh này.</p>
      </div>
    );
  }

  const displayStaffList = staffList.filter((s: any) => s.role !== 'SUPER_ADMIN');

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Nhân sự</h1>
          <p className="text-slate-500 mt-1">Quản lý các tài khoản thuộc chi nhánh của bạn</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Thêm Nhân sự
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6">
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-medium text-slate-500">Họ và Tên</th>
                  <th className="p-4 font-medium text-slate-500">Email / Tên Đăng Nhập</th>
                  <th className="p-4 font-medium text-slate-500">Số điện thoại</th>
                  <th className="p-4 font-medium text-slate-500">Vai trò</th>
                  <th className="p-4 font-medium text-slate-500">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Đang tải danh sách nhân sự từ đám mây...
                    </td>
                  </tr>
                )}
                {!loading && displayStaffList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      <UserCog className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      Chưa có nhân sự nào được phân vào chi nhánh này.
                    </td>
                  </tr>
                ) : (
                  !loading && displayStaffList.map((staff: any) => (
                    <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-medium text-slate-800">{staff.name}</td>
                      <td className="p-4 text-slate-600">{staff.email}</td>
                      <td className="p-4 text-slate-600">{staff.phone}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                          {staff.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${staff.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {staff.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
