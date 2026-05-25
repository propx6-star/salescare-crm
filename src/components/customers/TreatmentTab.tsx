import { useState } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabase';
import { useAuthStore } from '../../store/authStore';
import { Plus, CheckCircle, Clock, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export default function TreatmentTab({ customerId }: { customerId: number }) {
  const { data: packages = [], loading } = useSupabaseQuery<any>({ table: 'treatment_packages', eq: { customer_id: customerId }, order: { column: 'created_at', ascending: false } });

  const [isCreating, setIsCreating] = useState(false);

  if (loading) {
    return <div className="p-4 text-center text-slate-500">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800">Gói Liệu trình</h3>
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Thêm liệu trình
          </button>
        )}
      </div>

      {isCreating && (
        <CreatePackageForm customerId={customerId} onClose={() => setIsCreating(false)} />
      )}

      {!isCreating && packages.length === 0 && (
        <div className="text-center py-10 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
          <div className="text-slate-500">Khách hàng chưa có gói liệu trình nào.</div>
        </div>
      )}

      {!isCreating && packages.length > 0 && (
        <div className="space-y-4">
          {packages.map(pkg => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      )}
    </div>
  );
}

function PackageCard({ pkg }: { pkg: any }) {
  const { data: sessions = [] } = useSupabaseQuery<any>({ table: 'treatment_sessions', eq: { package_id: pkg.id }, order: { column: 'created_at', ascending: false } });
  
  const treatmentPackageMutation = useSupabaseMutation('treatment_packages');
  const treatmentSessionMutation = useSupabaseMutation('treatment_sessions');
  const user = useAuthStore(state => state.user);

  const progress = Math.round((pkg.used_sessions / pkg.total_sessions) * 100);

  const handleAddSession = async () => {
    if (pkg.remaining_sessions <= 0) return alert("Liệu trình đã hết buổi!");
    
    const now = new Date().toISOString();
    await treatmentSessionMutation.insert({
      shop_id: pkg.shop_id,
      package_id: pkg.id,
      customer_id: pkg.customer_id,
      session_date: format(new Date(), 'yyyy-MM-dd'),
      service_name: `${pkg.service_name} (Buổi ${pkg.used_sessions + 1})`,
      staff_id: user?.id,
      note: '',
      status: 'Đã làm',
      created_at: now,
      updated_at: now
    });

    await treatmentPackageMutation.update(pkg.id, {
      used_sessions: pkg.used_sessions + 1,
      remaining_sessions: pkg.remaining_sessions - 1,
      status: pkg.remaining_sessions - 1 === 0 ? 'Hoàn thành' : pkg.status,
      updated_at: now
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-lg text-slate-800">{pkg.package_name}</h4>
          <p className="text-sm text-slate-500 mt-1">{pkg.service_name}</p>
        </div>
        <div className="text-right">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            pkg.status === 'Hoàn thành' ? 'bg-green-100 text-green-800' :
            pkg.status === 'Đang hoạt động' ? 'bg-blue-100 text-blue-800' :
            'bg-slate-100 text-slate-800'
          }`}>
            {pkg.status}
          </span>
          <div className="text-sm font-medium text-slate-700 mt-2">
            Còn lại: <span className="text-blue-600 text-lg">{pkg.remaining_sessions}</span> / {pkg.total_sessions} buổi
          </div>
        </div>
      </div>
      
      <div className="bg-slate-50/50 p-5 space-y-4">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Tiến độ: {progress}%</span>
            <span>Đã dùng: {pkg.used_sessions} buổi</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div className={`h-2.5 rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="flex gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4 text-slate-400" /> Bắt đầu: {format(new Date(pkg.start_date), 'dd/MM/yyyy')}</div>
          {pkg.expiry_date && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" /> Hết hạn: {format(new Date(pkg.expiry_date), 'dd/MM/yyyy')}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-200 mt-4 flex justify-between items-center">
          <h5 className="text-sm font-medium text-slate-800">Lịch sử các buổi:</h5>
          {pkg.remaining_sessions > 0 && (
            <button 
              onClick={handleAddSession}
              className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded font-medium transition-colors"
            >
              + Ghi nhận đã làm 1 buổi
            </button>
          )}
        </div>

        {sessions && sessions.length > 0 ? (
          <div className="space-y-2 mt-3">
            {sessions.map((s, index) => (
              <div key={s.id} className="flex justify-between items-center bg-white p-3 border border-slate-100 rounded text-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <div>
                    <span className="font-medium text-slate-800">{s.service_name}</span>
                    <span className="text-slate-400 text-xs ml-2">({format(new Date(s.session_date), 'dd/MM/yyyy')})</span>
                  </div>
                </div>
                <div className="text-slate-500 text-xs">
                  KTV: {s.staff_id}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500 italic mt-3">Chưa sử dụng buổi nào.</div>
        )}
      </div>
    </div>
  );
}

function CreatePackageForm({ customerId, onClose }: { customerId: number, onClose: () => void }) {
  const user = useAuthStore(state => state.user);
  const treatmentPackageMutation = useSupabaseMutation('treatment_packages');
  
  const [formData, setFormData] = useState({
    package_name: '',
    service_name: '',
    total_sessions: 10,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    expiry_date: format(new Date(new Date().setMonth(new Date().getMonth() + 6)), 'yyyy-MM-dd'),
    assigned_to: 'admin',
    note: ''
  });

  const handleSave = async () => {
    if (!formData.package_name || !formData.service_name) {
      return alert("Vui lòng nhập tên gói và tên dịch vụ!");
    }

    const now = new Date().toISOString();
    await treatmentPackageMutation.insert({
      shop_id: user?.shop_id || null,
      customer_id: customerId,
      package_name: formData.package_name,
      service_name: formData.service_name,
      total_sessions: Number(formData.total_sessions),
      used_sessions: 0,
      remaining_sessions: Number(formData.total_sessions),
      start_date: formData.start_date,
      expiry_date: formData.expiry_date,
      assigned_to: user?.id,
      status: 'Đang hoạt động',
      note: formData.note,
      created_at: now,
      updated_at: now
    });
    onClose();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Tạo Liệu trình mới</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tên gói liệu trình *</label>
          <input 
            type="text" required
            placeholder="VD: Gói Trị Mụn 10 buổi"
            value={formData.package_name}
            onChange={(e) => setFormData({...formData, package_name: e.target.value})}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Dịch vụ chính *</label>
          <input 
            type="text" required
            placeholder="VD: Trị mụn chuyên sâu"
            value={formData.service_name}
            onChange={(e) => setFormData({...formData, service_name: e.target.value})}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tổng số buổi</label>
          <input 
            type="number" min="1"
            value={formData.total_sessions}
            onChange={(e) => setFormData({...formData, total_sessions: Number(e.target.value)})}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">KTV/Bác sĩ phụ trách</label>
          <input 
            type="text"
            value={formData.assigned_to}
            onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Ngày bắt đầu</label>
          <input 
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Ngày hết hạn (Tuỳ chọn)</label>
          <input 
            type="date"
            value={formData.expiry_date}
            onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú gói</label>
          <textarea 
            value={formData.note}
            onChange={(e) => setFormData({...formData, note: e.target.value})}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
        <button onClick={onClose} className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium">Hủy</button>
        <button onClick={handleSave} className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow-sm">Tạo gói</button>
      </div>
    </div>
  );
}
