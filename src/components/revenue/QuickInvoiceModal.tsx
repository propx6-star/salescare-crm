import { useState, useEffect } from 'react';
import { X, Search, Plus, Trash2, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabase';

export default function QuickInvoiceModal({ onClose }: { onClose: () => void }) {
  const user = useAuthStore(state => state.user);
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  
  // Mặc định lấy shop_id của user, nếu là SUPER_ADMIN thì lấy selectedShopId
  const effectiveShopId = user?.role === 'SUPER_ADMIN' ? selectedShopId : (user?.shop_id || '');

  const [phoneSearch, setPhoneSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');

  const [cart, setCart] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [customPrice, setCustomPrice] = useState(0);
  
  const [paymentMethod, setPaymentMethod] = useState('Tiền mặt');
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState<'VND'|'%'>('VND');
  const [paidAmount, setPaidAmount] = useState(0);
  const [reminderType, setReminderType] = useState('none');

  const { data: shops = [] } = useSupabaseQuery<any>({ table: 'shops' });
  const { data: products = [] } = useSupabaseQuery<any>({ 
    table: 'products',
    eq: effectiveShopId ? { shop_id: effectiveShopId } : undefined
  });
  const { data: customers = [], refetch: refetchCustomers } = useSupabaseQuery<any>({ 
    table: 'customers',
    eq: effectiveShopId ? { shop_id: effectiveShopId } : undefined
  });
  const { data: services = [] } = useSupabaseQuery<any>({ 
    table: 'services',
    eq: effectiveShopId ? { shop_id: effectiveShopId } : undefined
  });
  const { data: shopSettings = [] } = useSupabaseQuery<any>({ 
    table: 'shop_settings',
    eq: effectiveShopId ? { shop_id: effectiveShopId } : undefined
  });

  const settings = shopSettings[0];

  const customerMutation = useSupabaseMutation('customers');
  const orderMutation = useSupabaseMutation('orders');
  const orderItemsMutation = useSupabaseMutation('order_items');
  const productMutation = useSupabaseMutation('products');
  const transactionMutation = useSupabaseMutation('inventory_transactions');
  const reminderMutation = useSupabaseMutation('reminders');

  // Auto-search customer by phone
  useEffect(() => {
    if (phoneSearch.length >= 9 && effectiveShopId) {
      const found = customers.find((c: any) => c.phone.includes(phoneSearch));
      if (found) {
        setSelectedCustomer(found);
        setIsNewCustomer(false);
      } else {
        setSelectedCustomer(null);
        setIsNewCustomer(true);
      }
    } else {
      setSelectedCustomer(null);
      setIsNewCustomer(false);
    }
  }, [phoneSearch, customers, effectiveShopId]);

  const searchProducts = [
    ...products.map((p: any) => ({ ...p, type: 'product', display_name: p.name, display_price: p.selling_price })),
    ...services.map((s: any) => ({ ...s, type: 'service', display_name: s.name, display_price: s.price }))
  ].filter(item => 
    item.display_name.toLowerCase().includes(productSearch.toLowerCase()) || 
    (item.sku && item.sku.toLowerCase().includes(productSearch.toLowerCase())) ||
    (item.code && item.code.toLowerCase().includes(productSearch.toLowerCase()))
  ).slice(0, 8);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      setCart(cart.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { 
        product_id: product.id, 
        sku: product.sku || product.code, 
        name: product.display_name, 
        price: product.display_price, 
        quantity: 1,
        is_custom: false,
        type: product.type
      }]);
    }
    setProductSearch('');
  };

  const addCustomProduct = () => {
    if (!productSearch) return;
    setCart([...cart, {
      product_id: `custom_${Date.now()}`,
      sku: 'CUSTOM',
      name: productSearch,
      price: customPrice,
      quantity: 1,
      is_custom: true
    }]);
    setProductSearch('');
    setCustomPrice(0);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    const newCart = [...cart];
    newCart[index].quantity = quantity;
    setCart(newCart);
  };

  const updatePrice = (index: number, price: number) => {
    if (price < 0) return;
    const newCart = [...cart];
    newCart[index].price = price;
    setCart(newCart);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = discountType === '%' ? (subtotal * discountValue / 100) : discountValue;
  const totalAmount = Math.max(0, subtotal - discountAmount);
  const debtAmount = Math.max(0, totalAmount - paidAmount);

  useEffect(() => {
    setPaidAmount(totalAmount);
  }, [totalAmount]);

  const handleSaveNewCustomer = async () => {
    if (!newCustomerName) return alert("Vui lòng nhập tên khách mới!");
    try {
      const newCus = await customerMutation.insert({
        name: newCustomerName,
        phone: phoneSearch,
        shop_id: effectiveShopId,
        source: 'Trực tiếp',
        status: 'Chưa mua',
        lead_temperature: 'Nóng',
        tags: [],
        assigned_to: user?.id,
        start_date: format(new Date(), 'yyyy-MM-dd'),
        total_revenue: 0,
        note: 'Khách tạo từ hóa đơn nhanh'
      });
      alert('Đã lưu khách hàng mới vào hệ thống!');
      refetchCustomers();
      setSelectedCustomer(newCus);
      setIsNewCustomer(false);
    } catch (err) {
      console.error(err);
      alert('Lỗi khi lưu khách hàng!');
    }
  };

  const handleSave = async () => {
    if (user?.role === 'SUPER_ADMIN' && !effectiveShopId) return alert('Vui lòng chọn cửa hàng!');
    if (cart.length === 0) return alert("Giỏ hàng trống!");
    if (!selectedCustomer && !isNewCustomer) return alert("Vui lòng chọn khách hàng!");
    if (isNewCustomer && !newCustomerName) return alert("Vui lòng nhập tên khách mới!");
    
    // Check stock for non-custom items
    if (settings?.deduct_stock_on_invoice_save && !settings.allow_negative_stock) {
      for (const item of cart) {
        if (item.is_custom) continue;
        const product = products.find((p: any) => p.id === item.product_id);
        if (!product || product.stock_quantity < item.quantity) {
          alert(`Sản phẩm "${item.name}" không đủ tồn kho (Còn: ${product?.stock_quantity || 0})!`);
          return;
        }
      }
    }

    const now = new Date().toISOString();
    let customerId = selectedCustomer?.id;

    try {
      // 1. Check Customer
      if (isNewCustomer && !customerId) {
        const newCus = await customerMutation.insert({
          name: newCustomerName,
          phone: phoneSearch,
          shop_id: effectiveShopId,
          source: 'Trực tiếp',
          status: 'Đã mua',
          lead_temperature: 'Nóng',
          tags: [],
          assigned_to: user?.id,
          start_date: format(new Date(), 'yyyy-MM-dd'),
          total_revenue: 0,
          note: 'Khách tạo từ hóa đơn nhanh'
        });
        customerId = newCus.id;
      }

      // 2. Create Order
      const invoicePrefix = settings?.invoice_prefix || 'HD-';
      const orderCode = settings?.auto_generate_invoice_code 
        ? `${invoicePrefix}${format(new Date(), 'yyMMddHHmm')}` 
        : `HD${format(new Date(), 'yyMMddHHmm')}`;
        
      const newOrder = await orderMutation.insert({
        shop_id: effectiveShopId,
        customer_id: customerId,
        order_code: orderCode,
        subtotal: subtotal,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        debt_amount: debtAmount,
        payment_method: paymentMethod,
        payment_status: debtAmount <= 0 ? 'Đã thanh toán' : (paidAmount > 0 ? 'Thanh toán một phần' : 'Chưa thanh toán'),
        order_status: 'Hoàn thành',
        post_purchase_reminder_type: reminderType,
        reminder_status: reminderType !== 'none' ? 'pending' : 'done',
        assigned_to: user?.id,
        note: 'Lên hóa đơn nhanh',
        order_date: format(new Date(), 'yyyy-MM-dd'),
      });

      // 3. Create Order Items & Update Inventory
      for (const item of cart) {
        await orderItemsMutation.insert({
          order_id: newOrder.id,
          product_id: item.is_custom ? null : item.product_id,
          sku: item.sku,
          item_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          discount: 0,
          line_total: item.price * item.quantity,
        });

        // Trừ kho chỉ áp dụng cho type = 'product'
        if (!item.is_custom && item.type === 'product' && settings?.deduct_stock_on_invoice_save) {
          const product = products.find((p: any) => p.id === item.product_id);
            if (product) {
              const newStock = product.stock_quantity - item.quantity;
              await productMutation.update(product.id, { stock_quantity: newStock });
              
              await transactionMutation.insert({
                shop_id: effectiveShopId,
                product_id: product.id,
                sku: product.sku,
                type: 'sale',
                quantity: item.quantity,
                before_quantity: product.stock_quantity,
                after_quantity: newStock,
                related_order_id: newOrder.id,
                note: `Bán từ hóa đơn ${orderCode}`,
              });
            }
          }
        }

      // 4. Create Reminder
      if (reminderType !== 'none') {
        let days = 0;
        if (reminderType === '3days') days = 3;
        if (reminderType === '5days') days = 5;
        if (reminderType === '7days') days = 7;
        if (reminderType === '14days') days = 14;
        if (reminderType === '30days') days = 30;

        if (days > 0) {
          const remindDate = new Date();
          remindDate.setDate(remindDate.getDate() + days);
          await reminderMutation.insert({
            shop_id: effectiveShopId,
            customer_id: customerId,
            order_id: newOrder.id,
            assigned_to: user?.id,
            reminder_type: 'post_purchase',
            title: 'Chăm sóc sau mua',
            note: `Hỏi thăm khách sử dụng đơn hàng ${orderCode}`,
            remind_at: remindDate.toISOString(),
            status: 'pending',
          });
        }
      }

      // 5. Update customer revenue
      const cus = customers.find((c: any) => c.id === customerId);
      if (cus || isNewCustomer) {
        await customerMutation.update(customerId, {
          total_revenue: ((cus?.total_revenue) || 0) + totalAmount,
          last_purchase_date: format(new Date(), 'yyyy-MM-dd'),
          status: 'Đã mua'
        });
      }

      alert('Tạo hóa đơn thành công!');
      onClose();
    } catch (error) {
      console.error(error);
      alert('Lỗi tạo hóa đơn!');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Tạo hóa đơn nhanh</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-6">
            
            {user?.role === 'SUPER_ADMIN' && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Building2 className="w-4 h-4" /> 
                  Chọn Cửa hàng (Chỉ dành cho Admin) *
                </label>
                <select 
                  value={selectedShopId}
                  onChange={e => setSelectedShopId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-yellow-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="">-- Chọn cửa hàng --</option>
                  {shops.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {effectiveShopId ? (
              <>
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</span>
                Thông tin khách hàng
              </h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Nhập SĐT để tìm hoặc tạo mới..."
                    value={phoneSearch}
                    onChange={(e) => setPhoneSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {selectedCustomer && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-sm">
                  <div className="font-semibold text-green-800">{selectedCustomer.name}</div>
                  <div className="text-green-600">{selectedCustomer.phone} • Doanh thu: {selectedCustomer.total_revenue?.toLocaleString()}đ</div>
                </div>
              )}

              {isNewCustomer && phoneSearch.length >= 9 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
                  <div className="text-sm font-medium text-blue-800">Khách hàng mới! Hãy nhập tên:</div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Tên khách hàng mới"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button 
                      type="button"
                      onClick={handleSaveNewCustomer}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 whitespace-nowrap"
                    >
                      Lưu KH
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">3</span>
                Thanh toán
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tạm tính:</span>
                  <span className="font-semibold">{subtotal.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Giảm giá:</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="w-24 text-right px-2 py-1 border border-slate-300 rounded outline-none focus:border-blue-500"
                    />
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as 'VND' | '%')}
                      className="px-2 py-1 border border-slate-300 rounded outline-none text-sm bg-slate-50 focus:border-blue-500"
                    >
                      <option value="VND">VNĐ</option>
                      <option value="%">%</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-800">Tổng cộng:</span>
                  <span className="font-bold text-lg text-blue-600">{totalAmount.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Khách trả:</span>
                  <input 
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-32 text-right px-2 py-1 border border-slate-300 rounded outline-none focus:border-blue-500"
                  />
                </div>
                {debtAmount > 0 && (
                  <div className="flex justify-between items-center text-red-600">
                    <span>Còn nợ:</span>
                    <span className="font-bold">{debtAmount.toLocaleString()}đ</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phương thức TT</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option>Tiền mặt</option>
                  <option>Chuyển khoản</option>
                  <option>Thẻ (POS)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tự động nhắc chăm sóc</label>
                <select 
                  value={reminderType}
                  onChange={(e) => setReminderType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="none">Không nhắc</option>
                  <option value="3days">Sau 3 ngày (Hỏi thăm SD)</option>
                  <option value="7days">Sau 7 ngày (Hiệu quả)</option>
                  <option value="14days">Sau 14 ngày</option>
                </select>
              </div>
            </div>
            </>
            ) : (
              <div className="p-8 text-center text-slate-500">
                Vui lòng chọn cửa hàng để tạo hóa đơn.
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">2</span>
              Chọn Sản phẩm / Dịch vụ
            </h3>
            
            <div className="relative">
              <Search className="absolute left-3 top-[22px] -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm sản phẩm..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 mb-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              
              {productSearch && (
                <div className="absolute top-12 left-0 right-0 bg-white rounded-lg shadow-lg border border-slate-200 max-h-60 overflow-y-auto z-10">
                  {searchProducts.map((p: any) => (
                    <div 
                      key={p.id} 
                      onClick={() => addToCart(p)}
                      className="p-3 hover:bg-slate-50 border-b border-slate-100 cursor-pointer flex justify-between items-center"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm text-slate-800 flex items-center gap-2">
                          {p.display_name} 
                          {p.type === 'service' && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold uppercase">Dịch vụ</span>}
                        </div>
                        <div className="text-xs text-slate-500">
                          {p.type === 'product' ? `Tồn: ${p.stock_quantity}` : `Mã: ${p.code || '-'}`}
                        </div>
                      </div>
                      <div className="font-semibold text-sm text-blue-600">
                        {p.display_price.toLocaleString()}đ
                      </div>
                    </div>
                  ))}
                  <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2">
                    <p className="text-xs text-slate-500">Hoặc tự nhập tên và giá cho "{productSearch}":</p>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        placeholder="Giá VNĐ" 
                        value={customPrice}
                        onChange={e => setCustomPrice(Number(e.target.value))}
                        className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm outline-none"
                      />
                      <button onClick={addCustomProduct} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Thêm</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg h-64 overflow-y-auto p-2">
              {cart.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                  Chưa có sản phẩm nào
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item, index) => (
                    <div key={index} className="bg-white p-3 rounded border border-slate-100 shadow-sm flex items-center gap-3">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-slate-800 line-clamp-1">{item.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <input 
                            type="number" min="0"
                            value={item.price}
                            onChange={(e) => updatePrice(index, Number(e.target.value))}
                            className="w-24 px-2 py-1 text-xs border border-slate-300 rounded outline-none focus:border-blue-500"
                          />
                          <span className="text-xs text-slate-500">đ {item.is_custom && '(Tùy chỉnh)'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(index, Number(e.target.value))}
                          className="w-16 px-2 py-1 text-sm border border-slate-300 rounded outline-none"
                        />
                        <button onClick={() => removeFromCart(index)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg font-medium transition-colors">
            Hủy
          </button>
          <button onClick={handleSave} className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Lưu Hóa đơn
          </button>
        </div>
      </div>
    </div>
  );
}
