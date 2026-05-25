import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { User, Mail, Phone, Lock, ShieldCheck } from 'lucide-react';
import { db } from '../db/db';

export default function Profile() {
  const user = useAuthStore(state => state.user);
  const login = useAuthStore(state => state.login);

  const [name, setName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.email || ''); // Assuming we use phone field if exists
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      // In local DB mode, we update the user record
      await db.users.update(user.id, {
        name,
        // phone
      });
      
      // Update local state
      login({ ...user, full_name: name });
      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi cập nhật.' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu mới không khớp!' });
      return;
    }
    // In a real online app, we would call Supabase auth to update password
    // await supabase.auth.updateUser({ password: newPassword });
    setMessage({ type: 'success', text: 'Đổi mật khẩu thành công (Mô phỏng)!' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Thông tin cá nhân</h1>
        <p className="text-slate-500 mt-1">Quản lý hồ sơ và bảo mật tài khoản</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cập nhật thông tin */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-slate-800">Hồ sơ cá nhân</h2>
          </div>
          <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email / Tên đăng nhập</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Họ và Tên</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors">
              Lưu thay đổi
            </button>
          </form>
        </div>

        {/* Đổi mật khẩu & Bảo mật */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
              <Lock className="w-5 h-5 text-orange-500" />
              <h2 className="font-semibold text-slate-800">Đổi mật khẩu</h2>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 rounded-lg transition-colors">
                Đổi mật khẩu
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              <h2 className="font-semibold text-slate-800">Bảo vệ tài khoản (2FA)</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                Tính năng xác thực 2 lớp (2FA) bằng tin nhắn SMS và cảnh báo IP đăng nhập gửi qua Email đang được tích hợp.
              </p>
              <button disabled className="w-full bg-slate-100 text-slate-400 font-medium py-2 rounded-lg cursor-not-allowed border border-slate-200">
                Kích hoạt 2FA (Đang hoàn thiện)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
