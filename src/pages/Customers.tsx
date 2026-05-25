import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { useAuthStore } from '../store/authStore';
import { Search, Plus, Filter, MoreVertical, Phone, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function Customers() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: allCustomers = [], loading } = useSupabaseQuery<any>({
    table: 'customers',
    order: { column: 'created_at', ascending: false }
  });
  
  const customers = useMemo(() => {
    let filtered = allCustomers;
    
    // Role-based filtering
    if (user?.role !== 'admin') {
      filtered = filtered.filter(c => c.assigned_to === user?.id || !c.assigned_to);
    }
    
    // Search filtering
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.phone.includes(searchTerm)
      );
    }
    
    return filtered;
  }, [allCustomers, user, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Khách hàng</h1>
        <button 
          onClick={() => navigate('/customers/create')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm shadow-blue-200"
        >
          <Plus className="w-5 h-5" />
          Thêm khách hàng
        </button>
      </div>

      <div className="glass rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm theo tên hoặc số điện thoại..."
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
                <th className="p-4 font-medium">Khách hàng</th>
                <th className="p-4 font-medium hidden sm:table-cell">Nguồn</th>
                <th className="p-4 font-medium">Trạng thái</th>
                <th className="p-4 font-medium hidden md:table-cell">Ngày mua cuối</th>
                <th className="p-4 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Đang tải dữ liệu khách hàng từ đám mây...
                  </td>
                </tr>
              )}
              {!loading && customers?.map(customer => (
                <tr 
                  key={customer.id} 
                  onClick={() => navigate(`/customers/${customer.id}`)}
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{customer.name}</div>
                        <div className="text-sm text-slate-500">{customer.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      {customer.source}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      customer.status === 'Đã mua' ? 'bg-green-100 text-green-800' : 
                      customer.status === 'Đang tư vấn' ? 'bg-amber-100 text-amber-800' : 
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="p-4 hidden md:table-cell text-sm text-slate-600">
                    {customer.last_purchase_date ? format(new Date(customer.last_purchase_date), 'dd/MM/yyyy') : '-'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Gọi điện">
                        <Phone className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Nhắn tin">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {!loading && customers?.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Không tìm thấy khách hàng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
