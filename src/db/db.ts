import Dexie, { type EntityTable } from 'dexie';

// V5 New Core Entities
export interface Shop {
  id?: number;
  shop_code: string;
  name: string;
  type: string; // Spa, Clinic, Retail...
  phone: string;
  address: string;
  logo_url?: string;
  status: string; // active, inactive
  owner_user_id?: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id?: number;
  name: string;
  email: string;
  phone: string;
  role: string; // SUPER_ADMIN, SHOP_OWNER, MANAGER, SALES, STAFF
  status: string; // active, locked
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface UserShop {
  id?: number;
  user_id: number;
  shop_id: number;
  role: string;
  status: string;
  created_at: string;
}

export interface Role {
  id?: number;
  shop_id?: number; // Null if global
  name: string;
  description: string;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id?: number;
  key: string;
  name: string;
  group_name: string;
  description: string;
}

export interface RolePermission {
  id?: number;
  role_id: number;
  permission_key: string;
}

export interface UserPermission {
  id?: number;
  user_id: number;
  shop_id: number;
  permission_key: string;
  granted_by: string;
  created_at: string;
}

export interface ShopSetting {
  id?: number;
  shop_id: number;
  invoice_prefix: string;
  auto_generate_invoice_code: boolean;
  allow_negative_stock: boolean;
  deduct_stock_on_invoice_save: boolean;
  deduct_stock_on_paid_status: boolean;
  allow_edit_invoice_after_stock_deducted: boolean;
  low_stock_default_threshold: number;
  expiry_warning_days: number;
  notification_settings: string; // JSON string
  created_at: string;
  updated_at: string;
}

// Business Entities (Updated with shop_id)
export interface Customer {
  id?: number;
  shop_id: number;
  customer_code?: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  status: string;
  lead_temperature: string;
  tags: string[];
  assigned_to: string;
  start_date: string;
  last_purchase_date?: string;
  expected_repurchase_date?: string;
  total_revenue?: number;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id?: number;
  shop_id: number;
  order_code: string;
  customer_id: number;
  order_date: string;
  payment_date?: string;
  subtotal: number;
  discount: number;
  total_amount: number;
  paid_amount: number;
  debt_amount: number;
  payment_method: string; 
  payment_status: string; 
  order_status: string; 
  
  // V5 Stock Logic
  stock_status?: string; // not_required, pending, deducted, partially_deducted, returned
  stock_deducted_at?: string;
  stock_returned_at?: string;

  expected_repurchase_date?: string;
  repurchase_cycle_days?: number;
  post_purchase_reminder_type: string;
  post_purchase_reminder_date?: string;
  post_purchase_reminder_note?: string;
  reminder_status: string;
  
  assigned_to: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id?: number;
  shop_id: number;
  order_id: number;
  product_id?: number;
  sku?: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  line_total: number;
  
  // V5 Logic
  stock_deducted?: boolean;
  deducted_quantity?: number;
  stock_deducted_at?: string;

  created_at: string;
}

export interface Reminder {
  id?: number;
  shop_id: number;
  customer_id: number;
  order_id?: number;
  appointment_id?: number;
  assigned_to: string;
  reminder_type: string;
  title: string;
  note: string;
  remind_at: string;
  status: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id?: number;
  shop_id: number;
  customer_id: number;
  order_id?: number;
  type: string;
  content: string;
  created_by: string;
  created_at: string;
}

export interface Notification {
  id?: number;
  shop_id: number;
  user_id: string;
  reminder_id?: number;
  title: string;
  message: string;
  status: string;
  created_at: string;
  read_at?: string;
}

export interface MessageTemplate {
  id?: number;
  shop_id: number;
  title: string;
  content: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface SkinProfile {
  id?: number;
  shop_id: number;
  customer_id: number;
  skin_type: string;
  skin_concerns: string[];
  severity: string;
  current_products: string;
  irritation_products: string;
  allergies: string;
  contraindications: string;
  previous_services: string;
  goals: string;
  professional_note: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id?: number;
  shop_id: number;
  customer_id: number;
  service_name: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  staff_id: string;
  room: string;
  status: string;
  reminder_before: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface TreatmentPackage {
  id?: number;
  shop_id: number;
  customer_id: number;
  package_name: string;
  service_name: string;
  total_sessions: number;
  used_sessions: number;
  remaining_sessions: number;
  start_date: string;
  expiry_date: string;
  assigned_to: string;
  status: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface TreatmentSession {
  id?: number;
  shop_id: number;
  package_id: number;
  customer_id: number;
  session_date: string;
  service_name: string;
  staff_id: string;
  note: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BeforeAfterImage {
  id?: number;
  shop_id: number;
  customer_id: number;
  order_id?: number;
  treatment_package_id?: number;
  treatment_session_id?: number;
  image_url: string; // Base64
  image_type: string;
  treatment_area: string;
  capture_date: string;
  note: string;
  created_at: string;
}

export interface Product {
  id?: number;
  shop_id: number;
  name: string;
  sku: string;
  barcode?: string;
  brand: string;
  category: string;
  stock_quantity: number;
  unit: string;
  import_price: number;
  selling_price: number;
  expiry_date?: string;
  import_date?: string;
  supplier: string;
  low_stock_threshold: number;
  repurchase_cycle_days?: number;
  status: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id?: number;
  shop_id: number;
  product_id: number;
  sku?: string;
  type: string; // import, export, sale, return, adjustment, sale_update, sale_cancel_return, stocktake_adjustment
  quantity: number;
  before_quantity?: number;
  after_quantity?: number;
  related_order_id?: number;
  related_stocktake_id?: number;
  created_by?: string;
  note: string;
  created_at: string;
}

export interface LoyaltyPoint {
  id?: number;
  shop_id: number;
  customer_id: number;
  points: number;
  total_earned: number;
  total_redeemed: number;
  membership_tier: string;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id?: number;
  shop_id: number;
  customer_id: number;
  type: string;
  points: number;
  reason: string;
  order_id?: number;
  created_at: string;
}

export interface Voucher {
  id?: number;
  shop_id: number;
  code: string;
  customer_id?: number;
  discount_type: string;
  discount_value: number;
  expiry_date: string;
  status: string;
  created_at: string;
}

export interface ConsentForm {
  id?: number;
  shop_id: number;
  customer_id: number;
  form_type: string;
  title: string;
  content: string;
  related_service: string;
  signature_url?: string;
  signed_at?: string;
  created_by: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AiSuggestion {
  id?: number;
  shop_id: number;
  customer_id: number;
  suggestion_type: string;
  content: string;
  status: string;
  created_at: string;
}

export interface Stocktake {
  id?: number;
  shop_id: number;
  title: string;
  status: string; // pending, completed
  created_by: string;
  created_at: string;
  completed_at?: string;
}

export interface StocktakeItem {
  id?: number;
  shop_id: number;
  stocktake_id: number;
  product_id: number;
  sku: string;
  product_name: string;
  system_quantity: number;
  actual_quantity: number;
  difference: number;
  note: string;
  created_at: string;
}

export interface ImportLog {
  id?: number;
  shop_id: number;
  import_type: string;
  file_name: string;
  total_rows: number;
  success_rows: number;
  error_rows: number;
  status: string; // success, error
  error_detail: string;
  created_at: string;
}

const db = new Dexie('SalesCareCRM') as Dexie & {
  // V5 Auth/Admin
  shops: EntityTable<Shop, 'id'>;
  users: EntityTable<User, 'id'>;
  user_shops: EntityTable<UserShop, 'id'>;
  roles: EntityTable<Role, 'id'>;
  permissions: EntityTable<Permission, 'id'>;
  role_permissions: EntityTable<RolePermission, 'id'>;
  user_permissions: EntityTable<UserPermission, 'id'>;
  shop_settings: EntityTable<ShopSetting, 'id'>;

  // Business
  customers: EntityTable<Customer, 'id'>;
  orders: EntityTable<Order, 'id'>;
  order_items: EntityTable<OrderItem, 'id'>;
  reminders: EntityTable<Reminder, 'id'>;
  interactions: EntityTable<Interaction, 'id'>;
  notifications: EntityTable<Notification, 'id'>;
  message_templates: EntityTable<MessageTemplate, 'id'>;
  skin_profiles: EntityTable<SkinProfile, 'id'>;
  appointments: EntityTable<Appointment, 'id'>;
  treatment_packages: EntityTable<TreatmentPackage, 'id'>;
  treatment_sessions: EntityTable<TreatmentSession, 'id'>;
  before_after_images: EntityTable<BeforeAfterImage, 'id'>;
  products: EntityTable<Product, 'id'>;
  inventory_transactions: EntityTable<InventoryTransaction, 'id'>;
  loyalty_points: EntityTable<LoyaltyPoint, 'id'>;
  loyalty_transactions: EntityTable<LoyaltyTransaction, 'id'>;
  vouchers: EntityTable<Voucher, 'id'>;
  consent_forms: EntityTable<ConsentForm, 'id'>;
  ai_suggestions: EntityTable<AiSuggestion, 'id'>;
  stocktakes: EntityTable<Stocktake, 'id'>;
  stocktake_items: EntityTable<StocktakeItem, 'id'>;
  import_logs: EntityTable<ImportLog, 'id'>;
};

// V6 Schema Definition
db.version(6).stores({
  // New auth/admin
  shops: '++id, shop_code, status',
  users: '++id, email, phone, role, status',
  user_shops: '++id, user_id, shop_id, role',
  roles: '++id, shop_id, name',
  permissions: '++id, key, group_name',
  role_permissions: '++id, role_id, permission_key',
  user_permissions: '++id, user_id, shop_id, permission_key',
  shop_settings: '++id, shop_id',

  // Updated with shop_id indexing (Compound indexes for fast filtering)
  customers: '++id, shop_id, [shop_id+status], [shop_id+assigned_to], customer_code, phone',
  orders: '++id, shop_id, [shop_id+customer_id], [shop_id+order_date], order_code, payment_status, order_status',
  order_items: '++id, shop_id, order_id, [shop_id+order_id], [shop_id+product_id], sku',
  reminders: '++id, shop_id, [shop_id+customer_id], [shop_id+status], remind_at',
  interactions: '++id, shop_id, [shop_id+customer_id], type, created_at',
  notifications: '++id, shop_id, [shop_id+user_id], status, created_at',
  message_templates: '++id, shop_id, type',
  skin_profiles: '++id, shop_id, [shop_id+customer_id], skin_type',
  appointments: '++id, shop_id, [shop_id+customer_id], [shop_id+appointment_date], staff_id, status',
  treatment_packages: '++id, shop_id, [shop_id+customer_id], status, assigned_to',
  treatment_sessions: '++id, shop_id, [shop_id+package_id], [shop_id+customer_id], session_date, staff_id',
  before_after_images: '++id, shop_id, [shop_id+customer_id], image_type',
  products: '++id, shop_id, [shop_id+sku], [shop_id+category], barcode, status, expiry_date',
  inventory_transactions: '++id, shop_id, [shop_id+product_id], sku, type, related_order_id',
  loyalty_points: '++id, shop_id, [shop_id+customer_id], membership_tier',
  loyalty_transactions: '++id, shop_id, [shop_id+customer_id], type',
  vouchers: '++id, shop_id, code, [shop_id+customer_id], status',
  consent_forms: '++id, shop_id, [shop_id+customer_id], form_type, status',
  ai_suggestions: '++id, shop_id, [shop_id+customer_id], suggestion_type, status',
  stocktakes: '++id, shop_id, status',
  stocktake_items: '++id, shop_id, [shop_id+stocktake_id], product_id, sku',
  import_logs: '++id, shop_id, import_type, status'
});

export type { Dexie };
export { db };
