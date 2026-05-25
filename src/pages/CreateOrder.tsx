import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase';
import { ArrowLeft, Save, Calendar as CalendarIcon } from 'lucide-react';
import { format, addDays, startOfDay, parseISO } from 'date-fns';
import { useAuthStore } from '../store/authStore';

export default function CreateOrder() {
  const { id } = useParams();
  const customerId = Number(id);
  const navigate = useNavigate();

  const { data: customerData } = useSupabaseQuery<any>({
    table: 'customers',
    eq: { id: customerId }
  });
  const customer = customerData?.[0];
  const user = useAuthStore(state => state.user);

  const [formData, setFormData] = useState({
    product_name: '',
    quantity: 1,
    unit_price: 0,
    purchase_date: format(new Date(), 'yyyy-MM-dd'),
    repurchase_cycle_days: 0,
    post_purchase_reminder_type: 'none',
    post_purchase_reminder_custom_days: 0,
    post_purchase_reminder_note: '',
    note: ''
  });

  const orderMutation = useSupabaseMutation('orders');
  const reminderMutation = useSupabaseMutation('reminders');
  const customerMutation = useSupabaseMutation('customers');

  const handleSave = async () => {
    if (!customer || !formData.product_name) return;
    if (!user?.shop_id && user?.role !== 'SUPER_ADMIN') {
      alert('Không xác định được cửa hàng!');
      return;
    }
    const currentShopId = user?.shop_id || customer.shop_id;

    const purchaseDate = parseISO(formData.purchase_date);
    const amount = formData.quantity * formData.unit_price;
    const now = new Date();

    // Calculate dates
    let expectedRepurchaseDate = undefined;
    if (formData.repurchase_cycle_days > 0) {
      expectedRepurchaseDate = format(addDays(purchaseDate, formData.repurchase_cycle_days), 'yyyy-MM-dd');
    }

    let reminderDate = undefined;
    let daysToAdd = 0;
    
    if (formData.post_purchase_reminder_type !== 'none') {
      if (formData.post_purchase_reminder_type === 'custom') {
        daysToAdd = formData.post_purchase_reminder_custom_days;
      } else {
        daysToAdd = parseInt(formData.post_purchase_reminder_type.split('_')[0], 10);
      }
      reminderDate = format(addDays(purchaseDate, daysToAdd), 'yyyy-MM-dd');
    }

    try {
      // 1. Create Order
      const newOrder = await orderMutation.insert({
        shop_id: currentShopId,
        customer_id: customerId,
        order_code: `ORD-${Date.now().toString().slice(-6)}`,
        product_name: formData.product_name, // Note: This should ideally go to order_items
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        amount: amount,
        total_amount: amount,
        purchase_date: format(purchaseDate, 'yyyy-MM-dd'),
        expected_repurchase_date: expectedRepurchaseDate,
        repurchase_cycle_days: formData.repurchase_cycle_days,
        post_purchase_reminder_type: formData.post_purchase_reminder_type,
        post_purchase_reminder_date: reminderDate,
        post_purchase_reminder_note: formData.post_purchase_reminder_note,
        reminder_status: reminderDate ? 'pending' : 'done',
        assigned_to: customer.assigned_to || user.id,
        note: formData.note,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      });

      // 2. Create Reminder if needed
      if (reminderDate) {
        await reminderMutation.insert({
          shop_id: currentShopId,
          customer_id: customerId,
          order_id: newOrder.id,
          assigned_to: customer.assigned_to || user.id,
          reminder_type: `post_purchase_${daysToAdd}_days`,
          title: `Nhắc sau mua ${daysToAdd} ngày`,
          note: formData.post_purchase_reminder_note || `Hỏi thăm tình hình sử dụng ${formData.product_name}`,
          remind_at: startOfDay(parseISO(reminderDate)).toISOString(),
          status: 'pending',
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        });
      }

      // 3. Update Customer records
      await customerMutation.update(customerId, {
        last_purchase_date: format(purchaseDate, 'yyyy-MM-dd'),
        ...(expectedRepurchaseDate && { expected_repurchase_date: expectedRepurchaseDate }),
        status: 'Đã mua' // update status if not already
      });

      navigate(`/customers/${customerId}`);
    } catch (error) {
      console.error("Failed to create order", error);
      alert("Có lỗi xảy ra khi tạo hóa đơn.");
    }
  };

  if (!customer) return <div>Đang tải...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Tạo hóa đơn mới</h1>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm"
        >
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">Lưu hóa đơn</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 sm:p-6 space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">Thông tin sản phẩm</h2>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên khách hàng</label>
            <input type="text" value={customer.name} disabled className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sản phẩm/Dịch vụ *</label>
            <input 
              type="text" 
              value={formData.product_name}
              onChange={e => setFormData({...formData, product_name: e.target.value})}
              placeholder="VD: Serum phục hồi da" 
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Đơn giá (VNĐ)</label>
              <input 
                type="number" 
                value={formData.unit_price}
                onChange={e => setFormData({...formData, unit_price: Number(e.target.value)})}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng</label>
              <input 
                type="number" 
                min="1"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-blue-50 text-blue-800 rounded-lg font-medium border border-blue-100">
            <span>Tổng tiền:</span>
            <span className="text-lg">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(formData.quantity * formData.unit_price)}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ngày mua hàng</label>
              <input 
                type="date" 
                value={formData.purchase_date}
                onChange={e => setFormData({...formData, purchase_date: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Chu kỳ mua lại (ngày)</label>
              <select 
                value={formData.repurchase_cycle_days}
                onChange={e => setFormData({...formData, repurchase_cycle_days: Number(e.target.value)})}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              >
                <option value={0}>Không lặp lại</option>
                <option value={14}>14 ngày</option>
                <option value={30}>30 ngày (1 tháng)</option>
                <option value={60}>60 ngày (2 tháng)</option>
                <option value={90}>90 ngày (3 tháng)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><CalendarIcon className="w-5 h-5" /></div>
            <h2 className="text-lg font-semibold text-slate-800">Nhắc hẹn sau mua</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Thời gian nhắc (kể từ ngày mua)</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { val: 'none', label: 'Không' },
                { val: '3_days', label: '3 ngày' },
                { val: '5_days', label: '5 ngày' },
                { val: '7_days', label: '7 ngày' },
                { val: '14_days', label: '14 ngày' },
                { val: '30_days', label: '30 ngày' }
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setFormData({...formData, post_purchase_reminder_type: opt.val})}
                  className={`py-2 text-sm rounded-lg border font-medium transition-all ${
                    formData.post_purchase_reminder_type === opt.val 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {formData.post_purchase_reminder_type !== 'none' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú cho nhắc hẹn</label>
                <textarea 
                  rows={2}
                  value={formData.post_purchase_reminder_note}
                  onChange={e => setFormData({...formData, post_purchase_reminder_note: e.target.value})}
                  placeholder="VD: Hỏi khách xài serum có bị đỏ da không..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" 
                ></textarea>
              </div>
              <div className="text-sm text-blue-700 font-medium flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Hệ thống sẽ tự động tạo nhắc hẹn vào ngày: 
                <span className="bg-blue-100 px-2 py-0.5 rounded ml-1">
                  {format(addDays(parseISO(formData.purchase_date), parseInt(formData.post_purchase_reminder_type.split('_')[0], 10)), 'dd/MM/yyyy')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
