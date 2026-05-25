import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useSupabaseMutation } from '../../hooks/useSupabase';

interface EditOrderModalProps {
  order: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditOrderModal({ order, onClose, onSuccess }: EditOrderModalProps) {
  const [formData, setFormData] = useState({
    total_amount: order.total_amount || 0,
    paid_amount: order.paid_amount || 0,
    payment_status: order.payment_status || 'Chưa thanh toán',
    order_status: order.order_status || 'Hoàn thành',
    note: order.note || '',
    order_date: order.order_date ? order.order_date.substring(0, 10) : ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const orderMutation = useSupabaseMutation('orders');

  const debtAmount = Math.max(0, formData.total_amount - formData.paid_amount);

  // Auto reset to 0 if canceled
  useEffect(() => {
    if (formData.order_status === 'Đã hủy') {
      setFormData(prev => ({
        ...prev,
        total_amount: 0,
        paid_amount: 0,
        payment_status: 'Đã hủy'
      }));
    }
  }, [formData.order_status]);

  // Auto update payment_status based on debtAmount
  useEffect(() => {
    if (debtAmount <= 0) {
      setFormData(prev => ({ ...prev, payment_status: 'Đã thanh toán' }));
    } else if (formData.paid_amount > 0) {
      setFormData(prev => ({ ...prev, payment_status: 'Thanh toán một phần' }));
    } else {
      setFormData(prev => ({ ...prev, payment_status: 'Chưa thanh toán' }));
    }
  }, [formData.paid_amount, debtAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await orderMutation.update(order.id, {
        total_amount: formData.total_amount,
        paid_amount: formData.paid_amount,
        debt_amount: debtAmount,
        payment_status: formData.payment_status,
        order_status: formData.order_status,
        note: formData.note,
        order_date: formData.order_date,
        updated_at: new Date().toISOString()
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Lỗi cập nhật hóa đơn!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            Sửa hóa đơn: <span className="text-blue-600">{order.order_code}</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Tổng tiền hóa đơn (VNĐ)</label>
              <input 
                type="number" 
                min="0"
                value={formData.total_amount}
                onChange={e => setFormData({...formData, total_amount: Number(e.target.value)})}
                disabled={formData.order_status === 'Đã hủy'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Đã thanh toán (VNĐ)</label>
              <input 
                type="number" 
                min="0"
                value={formData.paid_amount}
                onChange={e => setFormData({...formData, paid_amount: Number(e.target.value)})}
                disabled={formData.order_status === 'Đã hủy'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-right disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Còn nợ (VNĐ)</label>
              <div className={`px-3 py-2 border border-slate-200 rounded-lg font-semibold text-right ${debtAmount > 0 ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                {new Intl.NumberFormat('vi-VN').format(debtAmount)} đ
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ngày mua</label>
              <input 
                type="date" 
                value={formData.order_date}
                onChange={e => setFormData({...formData, order_date: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái TT</label>
              <select 
                value={formData.payment_status}
                onChange={e => setFormData({...formData, payment_status: e.target.value})}
                disabled={formData.order_status === 'Đã hủy'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="Chưa thanh toán">Chưa thanh toán</option>
                <option value="Thanh toán một phần">Thanh toán một phần</option>
                <option value="Đã thanh toán">Đã thanh toán</option>
                <option value="Đã hủy">Đã hủy</option>
              </select>
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái Đơn</label>
              <select 
                value={formData.order_status}
                onChange={e => setFormData({...formData, order_status: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Đang xử lý">Đang xử lý</option>
                <option value="Hoàn thành">Hoàn thành</option>
                <option value="Đã hủy">Đã hủy</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
              <textarea 
                value={formData.note}
                onChange={e => setFormData({...formData, note: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
