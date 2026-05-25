import { useState } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase';
import { Calendar as CalendarIcon, CheckCircle, Clock, AlertCircle, Phone, MessageSquare } from 'lucide-react';
import { format, isToday, isPast, isFuture, startOfDay, parseISO } from 'date-fns';

export default function Reminders() {
  const [activeTab, setActiveTab] = useState<'today' | 'overdue' | 'upcoming' | 'done'>('today');

  const { data: allReminders = [] } = useSupabaseQuery<any>({ table: 'reminders', order: { column: 'remind_at', ascending: false } });
  const { data: customers = [] } = useSupabaseQuery<any>({ table: 'customers' });
  const reminderMutation = useSupabaseMutation('reminders');
  
  const customerMap = new Map(customers.map(c => [c.id, c]));

  const now = startOfDay(new Date());

  const filteredReminders = allReminders.filter(reminder => {
    const remindDate = startOfDay(parseISO(reminder.remind_at));
    
    // Auto mark overdue logically if needed (usually handled by a background job, but we compute it on the fly for display)
    const isOverdue = reminder.status === 'pending' && isPast(remindDate) && !isToday(remindDate);
    
    if (activeTab === 'today') {
      return reminder.status === 'pending' && isToday(remindDate);
    }
    if (activeTab === 'overdue') {
      return isOverdue || reminder.status === 'overdue';
    }
    if (activeTab === 'upcoming') {
      return reminder.status === 'pending' && isFuture(remindDate);
    }
    if (activeTab === 'done') {
      return reminder.status === 'done';
    }
    return true;
  });

  const handleMarkDone = async (id: number) => {
    await reminderMutation.update(id, { 
      status: 'done', 
      completed_at: new Date().toISOString() 
    });
  };

  const getStatusBadge = (status: string, remindAt: string) => {
    const remindDate = startOfDay(parseISO(remindAt));
    if (status === 'done') return <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium"><CheckCircle className="w-3 h-3" /> Đã xử lý</span>;
    if (status === 'overdue' || (status === 'pending' && isPast(remindDate) && !isToday(remindDate))) {
      return <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium"><AlertCircle className="w-3 h-3" /> Quá hạn</span>;
    }
    if (isToday(remindDate)) return <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium"><Clock className="w-3 h-3" /> Hôm nay</span>;
    return <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium"><CalendarIcon className="w-3 h-3" /> Sắp tới</span>;
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Quản lý nhắc hẹn</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {[
          { id: 'today', label: 'Hôm nay' },
          { id: 'overdue', label: 'Quá hạn' },
          { id: 'upcoming', label: 'Sắp tới' },
          { id: 'done', label: 'Đã xử lý' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id 
                ? 'bg-slate-800 text-white shadow-md' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredReminders.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center flex flex-col items-center">
          <CalendarIcon className="w-12 h-12 text-slate-300 mb-3" />
          <h3 className="text-slate-500 font-medium">Không có nhắc hẹn nào</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReminders.map(reminder => {
            const customer = customerMap.get(reminder.customer_id);
            return (
              <div key={reminder.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex justify-between items-start mb-3">
                  {getStatusBadge(reminder.status, reminder.remind_at)}
                  <div className="text-xs font-medium text-slate-500">
                    {format(parseISO(reminder.remind_at), 'dd/MM/yyyy')}
                  </div>
                </div>

                <h3 className="font-semibold text-slate-800 text-lg mb-1 truncate" title={reminder.title}>
                  {reminder.title}
                </h3>
                
                <div className="bg-slate-50 rounded-lg p-3 my-3 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-blue-700">{customer?.name || 'Khách hàng ẩn'}</div>
                    <a href={`tel:${customer?.phone}`} className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {customer?.phone}
                    </a>
                  </div>
                  {reminder.note && (
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2" title={reminder.note}>
                      <span className="font-medium">Note:</span> {reminder.note}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                  {activeTab !== 'done' && reminder.status !== 'done' && (
                    <button 
                      onClick={() => handleMarkDone(reminder.id!)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Đã xử lý
                    </button>
                  )}
                  <button className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 rounded-lg text-sm font-medium transition-colors">
                    Chi tiết
                  </button>
                  <button className="p-2 border border-slate-200 hover:bg-slate-50 text-blue-600 rounded-lg transition-colors" title="Nhắn tin Zalo/SMS">
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
