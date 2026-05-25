import { useSupabaseQuery } from '../hooks/useSupabase';
import { Users, AlertCircle, Clock, Calendar, TrendingUp, DollarSign, CheckCircle } from 'lucide-react';
import { startOfDay, isToday, isPast, parseISO } from 'date-fns';

import { useAuthStore } from '../store/authStore';

export default function Dashboard() {
  const user = useAuthStore(state => state.user);

  const { data: customers = [] } = useSupabaseQuery<any>({ table: 'customers' });
  const { data: orders = [] } = useSupabaseQuery<any>({ table: 'orders' });
  const { data: reminders = [] } = useSupabaseQuery<any>({ table: 'reminders' });

  const today = startOfDay(new Date());

  // Thống kê
  const totalCustomers = customers.length;
  const newCustomersToday = customers.filter(c => isToday(parseISO(c.start_date))).length;
  
  const todayReminders = reminders.filter(r => r.status === 'pending' && isToday(parseISO(r.remind_at)));
  const overdueReminders = reminders.filter(r => r.status === 'pending' && isPast(parseISO(r.remind_at)) && !isToday(parseISO(r.remind_at)));
  
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const todayRevenue = orders.filter(o => o.order_date && isToday(parseISO(o.order_date))).reduce((sum, order) => sum + (order.total_amount || 0), 0);

  const StatCard = ({ title, value, icon, colorClass, bgColorClass }: any) => (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-default">
      <div className={`p-3 rounded-xl ${bgColorClass} ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">Tổng quan hoạt động kinh doanh hôm nay</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Khách cần chăm" 
          value={todayReminders.length} 
          icon={<Clock className="w-6 h-6" />} 
          colorClass="text-orange-600" bgColorClass="bg-orange-100" 
        />
        <StatCard 
          title="Quá hạn" 
          value={overdueReminders.length} 
          icon={<AlertCircle className="w-6 h-6" />} 
          colorClass="text-red-600" bgColorClass="bg-red-100" 
        />
        <StatCard 
          title="Doanh thu hôm nay" 
          value={new Intl.NumberFormat('vi-VN', { notation: 'compact', compactDisplay: 'short' }).format(todayRevenue)} 
          icon={<DollarSign className="w-6 h-6" />} 
          colorClass="text-green-600" bgColorClass="bg-green-100" 
        />
        <StatCard 
          title="Tổng khách hàng" 
          value={totalCustomers} 
          icon={<Users className="w-6 h-6" />} 
          colorClass="text-blue-600" bgColorClass="bg-blue-100" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              Cần xử lý hôm nay
            </h3>
            <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-medium">
              {todayReminders.length}
            </span>
          </div>
          <div className="p-4 flex-1 overflow-auto max-h-[400px]">
            {todayReminders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                <CheckCircle className="w-10 h-10 mb-2 opacity-20" />
                <p>Tuyệt vời! Không còn việc nào chưa xử lý.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayReminders.map(r => {
                  const c = customers.find(x => x.id === r.customer_id);
                  return (
                    <div key={r.id} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between">
                        <div className="font-medium text-slate-800">{r.title}</div>
                        <div className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded">Hôm nay</div>
                      </div>
                      <div className="text-sm text-blue-600 mt-1">{c?.name} • {c?.phone}</div>
                      {r.note && <div className="text-xs text-slate-500 mt-2 line-clamp-1">{r.note}</div>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Nhắc hẹn quá hạn
            </h3>
            <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">
              {overdueReminders.length}
            </span>
          </div>
          <div className="p-4 flex-1 overflow-auto max-h-[400px]">
            {overdueReminders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                <CheckCircle className="w-10 h-10 mb-2 opacity-20 text-green-500" />
                <p>Không có nhắc hẹn nào bị trễ.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {overdueReminders.map(r => {
                  const c = customers.find(x => x.id === r.customer_id);
                  return (
                    <div key={r.id} className="p-3 border border-red-200 bg-red-50/30 rounded-lg hover:bg-red-50/60 transition-colors">
                      <div className="flex justify-between">
                        <div className="font-medium text-slate-800">{r.title}</div>
                        <div className="text-xs text-red-600 font-medium bg-red-100 px-2 py-0.5 rounded">Quá hạn</div>
                      </div>
                      <div className="text-sm text-blue-600 mt-1">{c?.name} • {c?.phone}</div>
                      {r.note && <div className="text-xs text-slate-500 mt-2 line-clamp-1">{r.note}</div>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


