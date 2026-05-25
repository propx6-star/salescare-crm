import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Cài đặt</h1>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-8 text-center text-slate-500">
        <SettingsIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        Tính năng Cài đặt đang được phát triển...
      </div>
    </div>
  );
}
