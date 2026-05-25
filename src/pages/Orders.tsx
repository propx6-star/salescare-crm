import { useState } from 'react';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { FileText, Search, Printer, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import InvoicePrint from '../components/revenue/InvoicePrint';
import EditOrderModal from '../components/revenue/EditOrderModal';

export default function Orders() {
  const user = useAuthStore(state => state.user);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  
  const { data: allOrders = [], loading: ordersLoading, refetch } = useSupabaseQuery<any>({
    table: 'orders',
    order: { column: 'order_date', ascending: false }
  });
  
  const { data: allCustomers = [], loading: customersLoading } = useSupabaseQuery<any>({
    table: 'customers'
  });
  
  const customerMap = new Map(allCustomers.map(c => [c.id, c]));

  const orders = allOrders.filter(order => {
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'SHOP_OWNER') return true;
    const customer = customerMap.get(order.customer_id);
    return customer?.assigned_to === user?.id || !customer?.assigned_to;
  });

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Quản lý hóa đơn</h1>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-sm text-slate-500">
                <th className="p-4 font-medium">Mã HĐ</th>
                <th className="p-4 font-medium">Khách hàng</th>
                <th className="p-4 font-medium hidden md:table-cell">Sản phẩm</th>
                <th className="p-4 font-medium text-right">Tổng tiền</th>
                <th className="p-4 font-medium hidden sm:table-cell">Ngày mua</th>
                <th className="p-4 font-medium text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(ordersLoading || customersLoading) && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Đang tải danh sách hóa đơn từ đám mây...
                  </td>
                </tr>
              )}
              {!(ordersLoading || customersLoading) && orders.map(order => {
                const customer = customerMap.get(order.customer_id);
                return <OrderRow key={order.id} order={order} customer={customer} onEditOrder={setEditingOrder} />;
              })}
              
              {!(ordersLoading || customersLoading) && orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="w-10 h-10 text-slate-300 mb-2" />
                      Không có hóa đơn nào.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {editingOrder && (
        <EditOrderModal 
          order={editingOrder} 
          onClose={() => setEditingOrder(null)} 
          onSuccess={() => refetch()} 
        />
      )}
    </div>
  );
}

function OrderRow({ order, customer, onEditOrder }: { order: any, customer: any, onEditOrder: (order: any) => void }) {
  const { data: items = [] } = useSupabaseQuery<any>({
    table: 'order_items',
    eq: { order_id: order.id }
  });
  
  const user = useAuthStore(state => state.user);
  
  const { data: shopSettings = [] } = useSupabaseQuery<any>({
    table: 'shop_settings',
    eq: { shop_id: order.shop_id }
  });

  const { data: shops = [] } = useSupabaseQuery<any>({
    table: 'shops',
    eq: { id: order.shop_id }
  });

  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `HoaDon_${order.order_code}`,
  });
  
  const productNames = items && items.length > 0 ? items.map((i: any) => i.item_name).join(', ') : 'Đang tải...';

  return (
    <tr className="hover:bg-slate-50/50 transition-colors group">
      <td className="p-4 font-medium text-blue-600">
        <Link to={`/customers/${order.customer_id}`}>{order.order_code}</Link>
      </td>
      <td className="p-4">
        <div className="font-semibold text-slate-800">{customer?.name || 'Unknown'}</div>
        <div className="text-sm text-slate-500 hidden sm:block">{customer?.phone}</div>
      </td>
      <td className="p-4 hidden md:table-cell text-slate-700">
        {productNames}
      </td>
      <td className="p-4 text-right font-bold text-slate-800">
        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount || 0)}
      </td>
      <td className="p-4 hidden sm:table-cell text-slate-600">
        {order.order_date ? format(new Date(order.order_date), 'dd/MM/yyyy') : '-'}
      </td>
      <td className="p-4 text-center">
        <button 
          onClick={() => handlePrint()}
          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="In hóa đơn"
        >
          <Printer className="w-5 h-5" />
        </button>
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'SHOP_OWNER') && (
          <button 
            onClick={() => onEditOrder(order)}
            className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors ml-1"
            title="Sửa hóa đơn"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        )}
        <div className="hidden">
          <InvoicePrint 
            ref={printRef}
            order={order}
            customer={customer}
            items={items}
            shopSettings={shopSettings[0]}
            shopData={shops[0]}
          />
        </div>
      </td>
    </tr>
  );
}
