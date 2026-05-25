import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Khởi tạo Supabase client. Sẽ báo lỗi nếu chưa cấu hình URL và Key trong file .env
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Hàm kiểm tra trạng thái Supabase
export const isSupabaseConfigured = () => {
  return supabase !== null;
};
