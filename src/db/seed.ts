import { db } from './db';
import { subDays, startOfDay, addDays, formatISO } from 'date-fns';

export async function seedDatabase() {
  const shopCount = await db.shops.count();
  if (shopCount > 0) return; // Already seeded

  const now = new Date();
  const today = startOfDay(now);
  const thirtyDaysAgo = subDays(today, 30);
  const twentyDaysFuture = addDays(today, 20);

  // 1. Create Shops
  const shop1Id = await db.shops.add({
    shop_code: 'SHOP01',
    name: 'Chi nhánh Quận 1 (Trụ sở chính)',
    type: 'Spa',
    phone: '0901234567',
    address: '123 Lê Lợi, Q.1, TP.HCM',
    status: 'active',
    created_at: formatISO(now),
    updated_at: formatISO(now),
  });

  const shop2Id = await db.shops.add({
    shop_code: 'SHOP02',
    name: 'Chi nhánh Quận 3',
    type: 'Phòng khám da liễu',
    phone: '0909876543',
    address: '456 Võ Văn Tần, Q.3, TP.HCM',
    status: 'active',
    created_at: formatISO(now),
    updated_at: formatISO(now),
  });

  // 2. Create Global Admin
  await db.users.add({
    name: 'Admin Tổng',
    email: 'admin@salescare.com',
    phone: '0999999999',
    role: 'SUPER_ADMIN',
    status: 'active',
    created_at: formatISO(now),
    updated_at: formatISO(now),
  });

  // 3. Create Shop Owner & Staff for Shop 1
  const owner1Id = await db.users.add({
    name: 'Trần Thị Chủ',
    email: 'owner@shop1.com',
    phone: '0900000001',
    role: 'SHOP_OWNER',
    status: 'active',
    created_at: formatISO(now),
    updated_at: formatISO(now),
  });
  
  await db.user_shops.add({
    user_id: owner1Id as number,
    shop_id: shop1Id as number,
    role: 'SHOP_OWNER',
    status: 'active',
    created_at: formatISO(now)
  });

  // 4. Shop Settings
  await db.shop_settings.add({
    shop_id: shop1Id as number,
    invoice_prefix: 'HD-Q1-',
    auto_generate_invoice_code: true,
    allow_negative_stock: false,
    deduct_stock_on_invoice_save: true,
    deduct_stock_on_paid_status: false,
    allow_edit_invoice_after_stock_deducted: false,
    low_stock_default_threshold: 5,
    expiry_warning_days: 30,
    notification_settings: '{}',
    created_at: formatISO(now),
    updated_at: formatISO(now),
  });

  // 5. Inventory (Shop 1)
  const product1Id = await db.products.add({
    shop_id: shop1Id as number,
    name: 'Serum phục hồi da',
    sku: 'SRM001',
    brand: 'La Roche-Posay',
    category: 'Sản phẩm điều trị',
    stock_quantity: 5,
    unit: 'Chai',
    import_price: 300000,
    selling_price: 500000,
    expiry_date: formatISO(twentyDaysFuture),
    supplier: 'Nhà phân phối A',
    low_stock_threshold: 10,
    repurchase_cycle_days: 30,
    status: 'Sắp hết',
    created_at: formatISO(now),
    updated_at: formatISO(now),
  });

  // 6. Customers (Shop 1)
  const maiId = await db.customers.add({
    shop_id: shop1Id as number,
    name: 'Nguyễn Thị Mai',
    customer_code: 'KH001',
    phone: '0901111222',
    source: 'Facebook',
    status: 'Đã mua',
    lead_temperature: 'Nóng',
    tags: ['Spa', 'Trị mụn'],
    assigned_to: 'admin',
    start_date: formatISO(subDays(today, 30)),
    total_revenue: 1000000,
    last_purchase_date: formatISO(today),
    note: 'Khách VIP',
    created_at: formatISO(now),
    updated_at: formatISO(now),
  });

  // 7. Orders (Shop 1)
  const maiOrder1 = await db.orders.add({
    shop_id: shop1Id as number,
    customer_id: maiId as number,
    order_code: 'HD-Q1-001',
    order_date: formatISO(thirtyDaysAgo),
    payment_date: formatISO(thirtyDaysAgo),
    subtotal: 500000,
    discount: 0,
    total_amount: 500000,
    paid_amount: 500000,
    debt_amount: 0,
    payment_method: 'Chuyển khoản',
    payment_status: 'Đã thanh toán',
    order_status: 'Hoàn thành',
    stock_status: 'deducted',
    stock_deducted_at: formatISO(thirtyDaysAgo),
    post_purchase_reminder_type: 'none',
    reminder_status: 'done',
    assigned_to: 'admin',
    note: 'Mua lần đầu',
    created_at: formatISO(now),
    updated_at: formatISO(now),
  });

  await db.order_items.add({
    shop_id: shop1Id as number,
    order_id: maiOrder1 as number,
    product_id: product1Id as number,
    sku: 'SRM001',
    item_name: 'Serum phục hồi da',
    quantity: 1,
    unit_price: 500000,
    discount: 0,
    line_total: 500000,
    stock_deducted: true,
    deducted_quantity: 1,
    stock_deducted_at: formatISO(thirtyDaysAgo),
    created_at: formatISO(now)
  });

  // Add Inventory Transaction
  await db.inventory_transactions.add({
    shop_id: shop1Id as number,
    product_id: product1Id as number,
    sku: 'SRM001',
    type: 'sale',
    quantity: -1,
    before_quantity: 6,
    after_quantity: 5,
    related_order_id: maiOrder1 as number,
    created_by: 'Trần Thị Chủ',
    note: 'Bán hàng HD-Q1-001',
    created_at: formatISO(thirtyDaysAgo)
  });
}
