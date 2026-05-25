import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { BarChart2, TrendingUp, Users, CheckCircle, Clock } from 'lucide-react';

export default function Reports() {
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const orders = useLiveQuery(() => db.orders.toArray()) || [];
  const reminders = useLiveQuery(() => db.reminders.toArray()) || [];

  const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);
  const doneReminders = reminders.filter(r => r.status === 'done').length;
  const overdueReminders = reminders.filter(r => r.status === 'overdue').length;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Báo cáo</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-blue-100 text-blue-600 rounded-full mb-4">
            <TrendingUp className="w-8 h-8" />
          </div>
          <p className="text-slate-500 font-medium mb-1">Tổng doanh thu</p>
          <h2 className="text-3xl font-bold text-slate-800">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue)}
          </h2>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-green-100 text-green-600 rounded-full mb-4">
            <Users className="w-8 h-8" />
          </div>
          <p className="text-slate-500 font-medium mb-1">Tổng khách hàng</p>
          <h2 className="text-3xl font-bold text-slate-800">{customers.length}</h2>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-orange-100 text-orange-600 rounded-full mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <p className="text-slate-500 font-medium mb-1">Nhắc hẹn đã xử lý</p>
          <h2 className="text-3xl font-bold text-slate-800">{doneReminders} / {reminders.length}</h2>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-red-100 text-red-600 rounded-full mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <p className="text-slate-500 font-medium mb-1">Nhắc hẹn quá hạn</p>
          <h2 className="text-3xl font-bold text-slate-800">{overdueReminders}</h2>
        </div>
      </div>
    </div>
  );
}
