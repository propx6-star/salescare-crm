import { useState } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase';
import { Calendar as CalendarIcon, Clock, Plus, Search, CheckCircle2, XCircle, User, FileText, Check } from 'lucide-react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { useAuthStore } from '../store/authStore';

export default function Appointments() {
  const user = useAuthStore(state => state.user);
  const shopId = user?.shop_id || '';
  
  const { data: appointments = [], loading, refetch } = useSupabaseQuery<any>({
    table: 'appointments',
    eq: user?.role !== 'SUPER_ADMIN' ? { shop_id: shopId } : undefined,
    order: { column: 'appointment_date', ascending: true }
  });
  
  const { data: customers = [] } = useSupabaseQuery<any>({
    table: 'customers',
    eq: user?.role !== 'SUPER_ADMIN' ? { shop_id: shopId } : undefined
  });

  const apptMutation = useSupabaseMutation('appointments');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // all, today, upcoming
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    customer_id: '',
    service_name: '',
    appointment_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '10:00',
    note: ''
  });

  const handleSave = async () => {
    if (!formData.customer_id || !formData.service_name || !formData.appointment_date) {
      return alert('Vui lòng điền đầy đủ thông tin bắt buộc');
    }
    try {
      await apptMutation.insert({
        ...formData,
        shop_id: user?.role === 'SUPER_ADMIN' ? customers.find((c: any) => c.id === Number(formData.customer_id))?.shop_id : shopId,
        status: 'pending',
        staff_id: user?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      setIsModalOpen(false);
      setFormData({
        customer_id: '',
        service_name: '',
        appointment_date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '09:00',
        end_time: '10:00',
        note: ''
      });
      refetch();
    } catch (error) {
      alert('Lỗi khi tạo lịch hẹn');
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await apptMutation.update(id, { status, updated_at: new Date().toISOString() });
      refetch();
    } catch (error) {
      alert('Lỗi cập nhật trạng thái');
    }
  };

  const enrichedAppointments = appointments.map((appt: any) => ({
    ...appt,
    customer: customers.find((c: any) => c.id === appt.customer_id)
  }));

  const filteredAppointments = enrichedAppointments.filter((appt: any) => {
    const matchesSearch = appt.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          appt.customer?.phone?.includes(searchTerm) ||
                          appt.service_name?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    
    if (filter === 'today') {
      return isToday(parseISO(appt.appointment_date));
    }
    if (filter === 'upcoming') {
      return new Date(appt.appointment_date) >= new Date() && appt.status === 'pending';
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Quản lý Lịch hẹn</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Tạo lịch hẹn</span>
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 flex flex-col sm:flex-row gap-3 border border-slate-200 shadow-sm">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Tất cả
          </button>
          <button 
            onClick={() => setFilter('today')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'today' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Hôm nay
          </button>
          <button 
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'upcoming' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Sắp tới
          </button>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm theo tên khách, SĐT, dịch vụ..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải lịch hẹn...</div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>Chưa có lịch hẹn nào.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAppointments.map((appt: any) => (
              <div key={appt.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row gap-4 sm:items-center">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 text-lg">{appt.customer?.name || 'Khách không xác định'}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                      appt.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : 
                      appt.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' : 
                      'bg-orange-50 text-orange-700 border-orange-200'
                    }`}>
                      {appt.status === 'completed' ? 'Đã đến' : appt.status === 'cancelled' ? 'Đã hủy' : 'Chờ phục vụ'}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 flex items-center gap-4">
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {appt.customer?.phone}</span>
                    <span className="flex items-center gap-1 text-blue-600 font-medium"><FileText className="w-3.5 h-3.5" /> {appt.service_name}</span>
                  </div>
                  {appt.note && (
                    <div className="text-sm text-slate-500 italic mt-1">Ghi chú: {appt.note}</div>
                  )}
                </div>
                
                <div className="flex flex-col sm:items-end gap-2">
                  <div className="flex items-center gap-2 text-slate-700 font-medium bg-slate-100 px-3 py-1.5 rounded-lg">
                    <CalendarIcon className="w-4 h-4 text-blue-500" />
                    {isToday(parseISO(appt.appointment_date)) ? 'Hôm nay' : isTomorrow(parseISO(appt.appointment_date)) ? 'Ngày mai' : format(parseISO(appt.appointment_date), 'dd/MM/yyyy')}
                    <span className="text-slate-300">|</span>
                    <Clock className="w-4 h-4 text-orange-500" />
                    {appt.start_time}
                  </div>
                  
                  {appt.status === 'pending' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleUpdateStatus(appt.id, 'completed')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Check className="w-4 h-4" /> Đã đến
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                      >
                        <XCircle className="w-4 h-4" /> Hủy hẹn
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Tạo lịch hẹn mới</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Khách hàng *</label>
                <select 
                  value={formData.customer_id}
                  onChange={e => setFormData({...formData, customer_id: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dịch vụ / Sản phẩm quan tâm *</label>
                <input 
                  type="text" 
                  placeholder="VD: Chăm sóc da chuyên sâu"
                  value={formData.service_name}
                  onChange={e => setFormData({...formData, service_name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày hẹn *</label>
                  <input 
                    type="date" 
                    value={formData.appointment_date}
                    onChange={e => setFormData({...formData, appointment_date: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Giờ hẹn *</label>
                  <input 
                    type="time" 
                    value={formData.start_time}
                    onChange={e => setFormData({...formData, start_time: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                <textarea 
                  rows={2}
                  value={formData.note}
                  onChange={e => setFormData({...formData, note: e.target.value})}
                  placeholder="Nhắc nhở hoặc yêu cầu đặc biệt..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors">
                Hủy
              </button>
              <button onClick={handleSave} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors">
                Lưu lịch hẹn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
