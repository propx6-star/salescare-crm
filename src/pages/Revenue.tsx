import { useState } from 'react';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { DollarSign, FileText, TrendingUp, Search, Plus, Filter, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import QuickInvoiceModal from '../components/revenue/QuickInvoiceModal';
import PaymentSettingsModal from '../components/revenue/PaymentSettingsModal';
import { useAuthStore } from '../store/authStore';

export default function Revenue() {
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentSettingsOpen, setIsPaymentSettingsOpen] = useState(false);

  const user = useAuthStore(state => state.user);

  const { data: allOrders = [] } = useSupabaseQuery<any>({ table: 'orders' });
  const { data: allCustomers = [] } = useSupabaseQuery<any>({ table: 'customers' });
  
  const customerMap = new Map(allCustomers.map(c => [c.id, c]));

  const now = new Date();
  const getInterval = () => {
    switch(dateFilter) {
      case 'today': return { start: startOfDay(now), end: endOfDay(now) };
      case 'week': return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'month': return { start: startOfMonth(now), end: endOfMonth(now) };
      default: return null;
    }
  };

  const interval = getInterval();

  const filteredOrders = allOrders.filter(order => {
    const orderDate = new Date(order.order_date);
    const matchesDate = interval ? isWithinInterval(orderDate, interval) : true;
    
    if (!matchesDate) return false;
    
    if (searchTerm) {
      const customer = customerMap.get(order.customer_id);
      const search = searchTerm.toLowerCase();
      return order.order_code.toLowerCase().includes(search) || 
             (customer && (customer.name.toLowerCase().includes(search) || customer.phone.includes(search)));
    }
    
    return true;
  });

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalPaid = filteredOrders.reduce((sum, o) => sum + (o.paid_amount || 0), 0);
  const totalDebt = filteredOrders.reduce((sum, o) => sum + (o.debt_amount || 0), 0);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Quản lý Doanh thu</h1>
        <div className="flex gap-2">
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'SHOP_OWNER') && (
            <button 
              onClick={() => setIsPaymentSettingsOpen(true)}
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
            >
              Cài đặt Thanh toán
            </button>
          )}
          <Link to="/orders" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
            Tất cả hóa đơn
          </Link>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Tạo hóa đơn nhanh
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm w-max">
        <button onClick={() => setDateFilter('today')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${dateFilter === 'today' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Hôm nay</button>
        <button onClick={() => setDateFilter('week')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${dateFilter === 'week' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Tuần này</button>
        <button onClick={() => setDateFilter('month')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${dateFilter === 'month' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Tháng này</button>
        <button onClick={() => setDateFilter('all')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${dateFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Tất cả</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10">
            <div className="text-sm text-slate-500 font-medium mb-1">Tổng Doanh thu</div>
            <div className="text-2xl font-bold text-slate-800">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue)}</div>
          </div>
          <DollarSign className="w-8 h-8 text-blue-500 absolute bottom-4 right-4 opacity-20" />
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-green-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10">
            <div className="text-sm text-slate-500 font-medium mb-1">Đã thanh toán (Thực thu)</div>
            <div className="text-2xl font-bold text-slate-800 text-green-700">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPaid)}</div>
          </div>
          <TrendingUp className="w-8 h-8 text-green-500 absolute bottom-4 right-4 opacity-20" />
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10">
            <div className="text-sm text-slate-500 font-medium mb-1">Còn nợ (Công nợ)</div>
            <div className="text-2xl font-bold text-slate-800 text-red-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalDebt)}</div>
          </div>
          <AlertTriangle className="w-8 h-8 text-red-500 absolute bottom-4 right-4 opacity-20" />
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-slate-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10">
            <div className="text-sm text-slate-500 font-medium mb-1">Số lượng hóa đơn</div>
            <div className="text-2xl font-bold text-slate-800">{filteredOrders.length}</div>
          </div>
          <FileText className="w-8 h-8 text-slate-500 absolute bottom-4 right-4 opacity-20" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 bg-slate-50/30">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm theo mã HĐ, tên hoặc SĐT khách hàng..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium shadow-sm">
            <Filter className="w-4 h-4" />
            Bộ lọc nâng cao
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500 uppercase tracking-wider">
                <th className="p-4 font-medium">Mã HĐ</th>
                <th className="p-4 font-medium">Khách hàng</th>
                <th className="p-4 font-medium text-right">Tổng tiền</th>
                <th className="p-4 font-medium text-center">Trạng thái</th>
                <th className="p-4 font-medium hidden sm:table-cell">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map(order => {
                const customer = customerMap.get(order.customer_id);
                return (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-medium text-blue-600">
                      <Link to={`/customers/${order.customer_id}`}>{order.order_code}</Link>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{customer?.name || 'Unknown'}</div>
                      <div className="text-sm text-slate-500">{customer?.phone}</div>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-800">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount || 0)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.payment_status === 'Đã thanh toán' ? 'bg-green-100 text-green-800' : 
                        order.payment_status === 'Thanh toán một phần' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="p-4 hidden sm:table-cell text-sm text-slate-600">
                      {order.order_date ? format(new Date(order.order_date), 'dd/MM/yyyy HH:mm') : '-'}
                    </td>
                  </tr>
                )
              })}
              
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Không tìm thấy dữ liệu doanh thu phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && <QuickInvoiceModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
