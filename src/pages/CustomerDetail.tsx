import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { ArrowLeft, User, FileText, Calendar, Clock, Plus, Sparkles, Image as ImageIcon, ShieldCheck, Heart, ClipboardCheck } from 'lucide-react';
import SkinProfileTab from '../components/customers/SkinProfileTab';
import TreatmentTab from '../components/customers/TreatmentTab';
import GalleryTab from '../components/customers/GalleryTab';
import { format } from 'date-fns';

export default function CustomerDetail() {
  const { id } = useParams();
  const customerId = Number(id);
  
  const [activeTab, setActiveTab] = useState('overview');

  const { data: customerData } = useSupabaseQuery<any>({ table: 'customers', eq: { id: customerId } });
  const customer = customerData?.[0];
  const { data: orders = [] } = useSupabaseQuery<any>({ table: 'orders', eq: { customer_id: customerId }, order: { column: 'created_at', ascending: false } });
  const { data: reminders = [] } = useSupabaseQuery<any>({ table: 'reminders', eq: { customer_id: customerId }, order: { column: 'created_at', ascending: false } });

  if (!customer) return <div className="p-8 text-center text-slate-500">Đang tải...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link to="/customers" className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            {customer.name}
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              customer.status === 'Đã mua' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {customer.status}
            </span>
          </h1>
          <p className="text-slate-500">{customer.phone} • {customer.source}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-200">
          {[
            { id: 'overview', label: 'Tổng quan', icon: <User className="w-4 h-4" /> },
            { id: 'skin', label: 'Hồ sơ da', icon: <Sparkles className="w-4 h-4" /> },
            { id: 'orders', label: 'Hóa đơn', icon: <FileText className="w-4 h-4" /> },
            { id: 'reminders', label: 'Nhắc hẹn', icon: <Calendar className="w-4 h-4" /> },
            { id: 'treatment', label: 'Liệu trình', icon: <Heart className="w-4 h-4" /> },
            { id: 'gallery', label: 'Before/After', icon: <ImageIcon className="w-4 h-4" /> },
            { id: 'loyalty', label: 'Tích điểm', icon: <ShieldCheck className="w-4 h-4" /> },
            { id: 'forms', label: 'Biểu mẫu', icon: <ClipboardCheck className="w-4 h-4" /> },
            { id: 'interactions', label: 'Tương tác', icon: <Clock className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors relative ${
                activeTab === tab.id ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Thông tin chung</h3>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div className="text-slate-500">Số điện thoại:</div>
                  <div className="font-medium text-slate-800">{customer.phone}</div>
                  
                  <div className="text-slate-500">Nguồn khách:</div>
                  <div className="font-medium text-slate-800">{customer.source}</div>
                  
                  <div className="text-slate-500">Mức độ quan tâm:</div>
                  <div className="font-medium text-slate-800">
                    <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-xs">
                      {customer.lead_temperature}
                    </span>
                  </div>

                  <div className="text-slate-500">Nhân viên phụ trách:</div>
                  <div className="font-medium text-slate-800">{customer.assigned_to}</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Thời gian</h3>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div className="text-slate-500">Bắt đầu chăm sóc:</div>
                  <div className="font-medium text-slate-800">{customer.start_date ? format(new Date(customer.start_date), 'dd/MM/yyyy') : '-'}</div>
                  
                  <div className="text-slate-500">Mua gần nhất:</div>
                  <div className="font-medium text-slate-800">{customer.last_purchase_date ? format(new Date(customer.last_purchase_date), 'dd/MM/yyyy') : '-'}</div>
                  
                  <div className="text-slate-500">Dự kiến mua lại:</div>
                  <div className="font-medium text-slate-800">{customer.expected_repurchase_date ? format(new Date(customer.expected_repurchase_date), 'dd/MM/yyyy') : '-'}</div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <h3 className="text-sm font-semibold text-slate-500">Ghi chú tổng quan</h3>
                <div className="bg-slate-50 p-4 rounded-lg text-slate-700 text-sm whitespace-pre-wrap border border-slate-100">
                  {customer.note || 'Không có ghi chú.'}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Link to={`/customers/${customerId}/create-order`} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm">
                  <Plus className="w-4 h-4" />
                  Tạo hóa đơn
                </Link>
              </div>
              
              {orders?.length === 0 ? (
                <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                  Chưa có hóa đơn nào
                </div>
              ) : (
                <div className="space-y-3">
                  {orders?.map(order => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reminders' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm">
                  <Plus className="w-4 h-4" />
                  Thêm nhắc hẹn
                </button>
              </div>

              {reminders?.length === 0 ? (
                <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                  Chưa có lịch nhắc hẹn
                </div>
              ) : (
                <div className="space-y-3">
                  {reminders?.map(reminder => (
                    <div key={reminder.id} className="flex items-start gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className={`p-2 rounded-full ${
                        reminder.status === 'done' ? 'bg-green-100 text-green-600' :
                        reminder.status === 'overdue' ? 'bg-red-100 text-red-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium text-slate-800">{reminder.title}</h4>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            reminder.status === 'done' ? 'bg-green-100 text-green-700' :
                            reminder.status === 'overdue' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {reminder.status === 'done' ? 'Đã xử lý' : reminder.status === 'overdue' ? 'Quá hạn' : 'Chờ xử lý'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{format(new Date(reminder.remind_at), 'dd/MM/yyyy')}</p>
                        {reminder.note && (
                          <div className="mt-2 text-sm text-slate-700 bg-white border border-slate-100 p-2 rounded">
                            {reminder.note}
                          </div>
                        )}
                        {reminder.status !== 'done' && (
                          <div className="mt-3 flex gap-2">
                            <button className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded transition-colors">
                              Đã xử lý
                            </button>
                            <button className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded transition-colors border border-slate-200">
                              Dời lịch
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'interactions' && (
            <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
              Lịch sử tương tác sẽ được cập nhật trong phiên bản sau.
            </div>
          )}

          {activeTab === 'skin' && (
            <SkinProfileTab customerId={customerId} />
          )}

          {activeTab === 'treatment' && (
            <TreatmentTab customerId={customerId} />
          )}

          {activeTab === 'gallery' && (
            <GalleryTab customerId={customerId} />
          )}

          {['loyalty', 'forms'].includes(activeTab) && (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Tính năng đang được phát triển</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                Module này nằm trong Kế hoạch v3 và sẽ sớm được ra mắt trong các bản cập nhật tới.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: any }) {
  const { data: items = [] } = useSupabaseQuery<any>({ table: 'order_items', eq: { order_id: order.id } });
  const productNames = items && items.length > 0 ? items.map((i:any) => i.item_name).join(', ') : 'Đang tải...';

  return (
    <div className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors bg-white">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-semibold text-blue-600">{order.order_code}</div>
          <div className="text-slate-800 font-medium">{productNames}</div>
        </div>
        <div className="text-right">
          <div className="font-bold text-slate-800">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount || 0)}</div>
          <div className="text-xs text-slate-500">{order.order_date ? format(new Date(order.order_date), 'dd/MM/yyyy') : '-'}</div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <div className="text-sm text-slate-500">
          Nhắc hẹn: <span className="font-medium text-slate-700">{order.post_purchase_reminder_type !== 'none' ? 'Có' : 'Không'}</span>
        </div>
        <div className="text-sm">
          {order.reminder_status === 'done' ? (
            <span className="text-green-600 bg-green-50 px-2 py-1 rounded font-medium">Đã nhắc</span>
          ) : order.reminder_status === 'pending' ? (
            <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded font-medium">Chờ nhắc</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
