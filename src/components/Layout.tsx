import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Calendar, FileText, BarChart2, Bell, X, Check, Settings, Package, DollarSign, LogOut, ShieldAlert, Store, UserCog, Wrench } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { isToday, parseISO } from 'date-fns';
import { useAuthStore } from '../store/authStore';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const hasPermission = useAuthStore(state => state.hasPermission);

  const shop = useLiveQuery(() => {
    if (user?.shop_id) return db.shops.get(user.shop_id);
    return undefined;
  }, [user?.shop_id]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const reminders = useLiveQuery(() => {
    if (user?.role === 'SUPER_ADMIN') return db.reminders.toArray();
    if (user?.shop_id) return db.reminders.where({ shop_id: user.shop_id }).toArray();
    return [];
  }, [user]) || [];
  
  const pendingToday = reminders.filter(r => r.status === 'pending' && isToday(parseISO(r.remind_at)));

  // Navigation logic
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <Home className="w-5 h-5" />, visible: true },
    { name: 'Quản trị hệ thống', path: '/admin', icon: <ShieldAlert className="w-5 h-5" />, visible: user?.role === 'SUPER_ADMIN' },
    { name: 'Doanh thu', path: '/revenue', icon: <DollarSign className="w-5 h-5" />, visible: true },
    { name: 'Khách hàng', path: '/customers', icon: <Users className="w-5 h-5" />, visible: true },
    { name: 'Hóa đơn', path: '/orders', icon: <FileText className="w-5 h-5" />, visible: true },
    { name: 'Lịch hẹn', path: '/appointments', icon: <Calendar className="w-5 h-5" />, visible: true },
    { name: 'Kho hàng', path: '/inventory', icon: <Package className="w-5 h-5" />, visible: true },
    { name: 'Dịch vụ', path: '/services', icon: <Wrench className="w-5 h-5" />, visible: true },
    { name: 'Nhắc hẹn', path: '/reminders', icon: <Bell className="w-5 h-5" />, visible: true },
    { name: 'Nhân viên', path: '/staff', icon: <UserCog className="w-5 h-5" />, visible: user?.role === 'SUPER_ADMIN' || user?.role === 'SHOP_OWNER' },
    { name: 'Báo cáo', path: '/reports', icon: <BarChart2 className="w-5 h-5" />, visible: true },
    { name: 'Cài đặt Shop', path: '/shop-settings', icon: <Store className="w-5 h-5" />, visible: user?.role === 'SUPER_ADMIN' || user?.role === 'SHOP_OWNER' },
  ].filter(item => item.visible);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200">
        <div className="p-4 flex flex-col gap-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0">
              S
            </div>
            <span className="font-bold text-lg text-slate-800 truncate">SalesCare</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-md px-2 py-1.5 flex items-center gap-2 mt-2">
            {user?.role === 'SUPER_ADMIN' ? (
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
            ) : (
              <Store className="w-4 h-4 text-blue-500 shrink-0" />
            )}
            <span className="text-xs font-semibold text-slate-700 truncate" title={shop?.name || 'Hệ thống Quản trị'}>
              {user?.role === 'SUPER_ADMIN' ? 'Hệ thống Quản trị' : (shop?.name || 'Đang tải...')}
            </span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/')
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              S
            </div>
            <span className="font-bold text-lg text-slate-800">SC V5</span>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors"
              title="Quay lại"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div className="font-semibold text-slate-800">
              {navItems.find(i => i.path === location.pathname)?.name || 'Hệ thống'}
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
            >
              <Bell className="w-5 h-5" />
              {pendingToday.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              )}
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowProfile(!showProfile)}
                className="w-8 h-8 bg-blue-100 text-blue-700 font-bold rounded-full border border-blue-200 flex items-center justify-center transition-colors hover:bg-blue-200"
              >
                {user?.full_name?.charAt(0) || 'U'}
              </button>
              
              {showProfile && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
                  <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <p className="font-semibold text-slate-800 line-clamp-1">{user?.full_name}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{user?.email}</p>
                    <div className="mt-2 flex gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold border ${
                        user?.role === 'SUPER_ADMIN' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'
                      }`}>
                        {user?.role}
                      </span>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setShowProfile(false)}
                    className="w-full text-left p-3 text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors font-medium text-sm border-b border-slate-100"
                  >
                    <Settings className="w-4 h-4" />
                    Hồ sơ & Bảo mật
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left p-3 text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-medium text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
            
            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
                <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h4 className="font-semibold text-slate-800">Thông báo</h4>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {pendingToday.length > 0 ? (
                    <div className="p-2 space-y-1">
                      {pendingToday.map(r => (
                        <div key={r.id} className="p-3 hover:bg-slate-50 rounded-lg cursor-pointer">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-sm text-slate-800">{r.title}</span>
                            <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Hôm nay</span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-1">{r.note}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                      <Check className="w-8 h-8 text-green-400 mb-2" />
                      <p className="text-sm">Bạn đã xử lý hết việc hôm nay!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex overflow-x-auto items-center h-16 pb-safe z-50 px-2 hide-scrollbar">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center min-w-[64px] h-full space-y-1 ${
              location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/')
                ? 'text-blue-600'
                : 'text-slate-500'
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-medium truncate w-full text-center px-1">{item.name}</span>
          </Link>
        ))}
      </nav>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
