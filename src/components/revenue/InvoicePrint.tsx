import React, { forwardRef } from 'react';
import { format } from 'date-fns';

interface InvoicePrintProps {
  order: any;
  customer: any;
  items: any[];
  shopSettings: any;
  shopData: any; // Thông tin shop
}

const InvoicePrint = forwardRef<HTMLDivElement, InvoicePrintProps>(({ order, customer, items, shopSettings, shopData }, ref) => {
  return (
    <div ref={ref} className="p-8 bg-white text-black font-sans w-full max-w-3xl mx-auto" style={{ width: '80mm', padding: '10px', fontSize: '12px' }}>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold uppercase">{shopData?.name || 'SALESCARE CRM'}</h1>
        <p className="text-sm">{shopData?.address || 'Địa chỉ Shop'}</p>
        <p className="text-sm">SĐT: {shopData?.phone || '0123456789'}</p>
        <h2 className="text-lg font-bold mt-4 uppercase border-y border-dashed border-black py-2">Hóa Đơn Bán Hàng</h2>
      </div>

      {/* Thông tin chung */}
      <div className="mb-4 text-sm">
        <p><strong>Mã HĐ:</strong> {order.order_code}</p>
        <p><strong>Ngày:</strong> {order.order_date ? format(new Date(order.order_date), 'dd/MM/yyyy HH:mm') : '-'}</p>
        <p><strong>Khách hàng:</strong> {customer?.name || 'Khách lẻ'}</p>
        <p><strong>SĐT:</strong> {customer?.phone || '-'}</p>
      </div>

      {/* Bảng sản phẩm/dịch vụ */}
      <table className="w-full text-left mb-4 text-sm border-collapse">
        <thead>
          <tr className="border-b border-black">
            <th className="pb-1 w-1/2">Tên SP/DV</th>
            <th className="pb-1 text-center w-1/6">SL</th>
            <th className="pb-1 text-right w-1/3">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="border-b border-dashed border-gray-300">
              <td className="py-2">{item.item_name}</td>
              <td className="py-2 text-center">{item.quantity}</td>
              <td className="py-2 text-right">{new Intl.NumberFormat('vi-VN').format(item.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Tổng tiền */}
      <div className="space-y-1 mb-6 text-sm">
        <div className="flex justify-between">
          <span>Tổng cộng:</span>
          <span className="font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount || 0)}</span>
        </div>
        <div className="flex justify-between">
          <span>Giảm giá:</span>
          <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.discount || 0)}</span>
        </div>
        <div className="flex justify-between border-t border-black pt-1 mt-1 text-base font-bold">
          <span>Khách cần trả:</span>
          <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount - (order.discount || 0))}</span>
        </div>
      </div>

      {/* QR Code (Nếu thanh toán chuyển khoản) */}
      {(order.payment_method === 'Chuyển khoản' || order.payment_method === 'Bank Transfer') && shopSettings?.qr_code_url && (
        <div className="text-center mb-6 border border-dashed border-gray-400 p-4 rounded-lg">
          <p className="font-bold mb-2">Quét mã QR để thanh toán</p>
          <img src={shopSettings.qr_code_url} alt="QR Code" className="w-32 h-32 mx-auto object-contain" />
          <div className="mt-2 text-xs">
            <p><strong>NH:</strong> {shopSettings.bank_name}</p>
            <p><strong>STK:</strong> {shopSettings.bank_account_number}</p>
            <p><strong>Tên:</strong> {shopSettings.bank_account_name}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs mt-6">
        <p>Cảm ơn quý khách và hẹn gặp lại!</p>
        <p className="italic text-gray-500 mt-1">Phần mềm quản lý bởi SalesCare CRM</p>
      </div>
    </div>
  );
});

InvoicePrint.displayName = 'InvoicePrint';

export default InvoicePrint;
