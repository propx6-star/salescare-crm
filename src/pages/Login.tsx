import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, type Role } from '../store/authStore';
import { Lock, Mail, ShieldAlert, Store, User } from 'lucide-react';
import { db } from '../db/db';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [otp, setOtp] = useState('');
  const [tempAuthData, setTempAuthData] = useState<any>(null);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSupabaseConfigured() && supabase) {
        // Thực tế: Đăng nhập với Supabase
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        
        if (!profileData) {
          // If no profile exists, create a default in memory just to allow login, 
          // or throw a clear error asking them to setup profiles.
          throw new Error('Tài khoản này chưa có dữ liệu Hồ sơ (Profile). Hãy chạy đoạn mã SQL Trigger mới nhất trên Supabase và tạo lại tài khoản!');
        }

        login({
          id: data.user.id as any,
          shop_id: profileData.shop_id,
          email: data.user.email || email,
          full_name: profileData.full_name,
          role: profileData.role as Role,
          permissions: profileData.permissions || []
        });
        navigate('/');
      } else {
        // V5 Mock Login based on DB
        const userRecord = await db.users.where('email').equals(email).first();
        
        if (!userRecord) {
          throw new Error('Sai email hoặc mật khẩu. Vui lòng kiểm tra lại.');
        }

        let shopId: number | undefined = undefined;
        
        if (userRecord.role !== 'SUPER_ADMIN') {
          const userShop = await db.user_shops.where('user_id').equals(userRecord.id!).first();
          if (!userShop) throw new Error('Tài khoản này chưa được gán vào cửa hàng nào!');
          shopId = userShop.shop_id;
        }

        setTempAuthData({
          id: userRecord.id!, 
          shop_id: shopId,
          email: userRecord.email, 
          full_name: userRecord.name, 
          role: userRecord.role as Role,
          permissions: userRecord.role === 'SHOP_OWNER' ? ['admin_panel.access', 'settings.view', 'staff.create'] : []
        });
        
        // Chuyển sang bước OTP thay vì login thẳng
        setStep('otp');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSupabaseConfigured() && supabase) {
        // Thực tế: Xác thực OTP qua Supabase
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'sms' // or 'email'
        });
        if (verifyError) throw verifyError;
      } else {
        // Mock: Giả lập xác thực OTP thành công nếu nhập 123456
        if (otp !== '123456') {
          throw new Error('Mã OTP không chính xác (Thử nhập: 123456)');
        }
      }
      
      // Nếu thành công thì login
      if (tempAuthData) {
        login(tempAuthData);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi xác thực OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleFastLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password');
    // Auto submit next tick or user can click login
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <span className="text-white text-2xl font-bold">SC</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Đăng nhập SalesCare V5</h1>
          <p className="text-slate-500 mt-2">
            {isSupabaseConfigured() ? 'Sử dụng tài khoản Supabase của bạn' : 'Chế độ Demo Đa Chi Nhánh (Local Mode)'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100">
            {error}
          </div>
        )}

        {step === 'login' ? (
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Nhập email..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="text-center mb-4">
              <p className="text-sm text-slate-600">
                Mã xác thực 2 lớp (OTP) đã được gửi đến số điện thoại của bạn.<br/>
                <span className="text-xs text-slate-400">(Bản Demo: Hãy nhập 123456)</span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mã OTP</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center tracking-widest text-lg font-bold"
                  placeholder="------"
                  maxLength={6}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang xác thực...' : 'Xác nhận OTP'}
            </button>
            <button
              type="button"
              onClick={() => setStep('login')}
              className="w-full text-slate-500 hover:text-slate-700 text-sm mt-2"
            >
              Quay lại
            </button>
          </form>
        )}

        {!isSupabaseConfigured() && (
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-500 font-medium mb-3 text-center">Đăng nhập nhanh (Bấm để chọn):</p>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => handleFastLogin('admin@salescare.com')}
                type="button" 
                className="flex items-center gap-3 p-3 text-left border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <div className="bg-red-100 text-red-600 p-2 rounded-lg">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800 text-sm">Super Admin</div>
                  <div className="text-xs text-slate-500">Quản trị toàn hệ thống</div>
                </div>
              </button>

              <button 
                onClick={() => handleFastLogin('owner@shop1.com')}
                type="button" 
                className="flex items-center gap-3 p-3 text-left border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800 text-sm">Chủ Shop Quận 1</div>
                  <div className="text-xs text-slate-500">Quản lý duy nhất Chi nhánh Quận 1</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
