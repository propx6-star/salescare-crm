import { useState } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabase';
import { useAuthStore } from '../../store/authStore';
import { Plus, Edit2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function SkinProfileTab({ customerId }: { customerId: number }) {
  const { data, loading } = useSupabaseQuery<any>({ table: 'skin_profiles', eq: { customer_id: customerId } });
  const profile = data?.[0];

  const [isEditing, setIsEditing] = useState(false);

  if (loading) {
    return <div className="p-4 text-center text-slate-500">Đang tải...</div>;
  }

  if (!profile && !isEditing) {
    return (
      <div className="text-center py-10 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
        <div className="text-slate-500 mb-4">Khách hàng này chưa có hồ sơ da.</div>
        <button 
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tạo hồ sơ da
        </button>
      </div>
    );
  }

  if (isEditing) {
    return (
      <SkinProfileForm 
        customerId={customerId} 
        initialData={profile} 
        onClose={() => setIsEditing(false)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800">Hồ sơ làn da</h3>
        <button 
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium transition-colors text-sm"
        >
          <Edit2 className="w-4 h-4" />
          Chỉnh sửa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-slate-200 rounded-xl p-6">
        <div className="space-y-4">
          <div>
            <div className="text-sm text-slate-500 mb-1">Loại da</div>
            <div className="font-medium text-slate-800">{profile.skin_type}</div>
          </div>
          
          <div>
            <div className="text-sm text-slate-500 mb-1">Vấn đề da</div>
            <div className="flex flex-wrap gap-2 mt-1">
              {profile.skin_concerns.map(c => (
                <span key={c} className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full font-medium">
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-500 mb-1">Mức độ</div>
            <div className="font-medium text-slate-800">{profile.severity}</div>
          </div>

          <div>
            <div className="text-sm text-slate-500 mb-1">Sản phẩm đang dùng</div>
            <div className="text-sm text-slate-800">{profile.current_products || '-'}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-sm text-slate-500 mb-1">Dị ứng / Kích ứng</div>
            <div className="text-sm text-slate-800">
              <span className="font-medium">Dị ứng:</span> {profile.allergies || 'Không'} <br/>
              <span className="font-medium">SP kích ứng:</span> {profile.irritation_products || 'Không'}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-500 mb-1">Chống chỉ định</div>
            <div className="text-sm text-red-600 font-medium">{profile.contraindications || 'Không'}</div>
          </div>

          <div>
            <div className="text-sm text-slate-500 mb-1">Dịch vụ đã từng làm</div>
            <div className="text-sm text-slate-800">{profile.previous_services || '-'}</div>
          </div>

          <div>
            <div className="text-sm text-slate-500 mb-1">Mục tiêu điều trị</div>
            <div className="text-sm text-slate-800">{profile.goals || '-'}</div>
          </div>
        </div>

        <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
          <div className="text-sm text-slate-500 mb-2 font-medium">Ghi chú chuyên môn (Của Bác sĩ/KTV)</div>
          <div className="bg-blue-50/50 p-4 rounded-lg text-sm text-slate-800 whitespace-pre-wrap border border-blue-100">
            {profile.professional_note || '-'}
          </div>
          <div className="text-xs text-slate-400 mt-3 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Cập nhật lần cuối: {format(new Date(profile.updated_at), 'dd/MM/yyyy HH:mm')}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkinProfileForm({ customerId, initialData, onClose }: { customerId: number, initialData?: any, onClose: () => void }) {
  const user = useAuthStore(state => state.user);
  const skinProfileMutation = useSupabaseMutation('skin_profiles');
  
  const [formData, setFormData] = useState({
    skin_type: initialData?.skin_type || 'Da thường',
    skin_concerns: initialData?.skin_concerns || [],
    severity: initialData?.severity || 'Nhẹ',
    current_products: initialData?.current_products || '',
    irritation_products: initialData?.irritation_products || '',
    allergies: initialData?.allergies || '',
    contraindications: initialData?.contraindications || '',
    previous_services: initialData?.previous_services || '',
    goals: initialData?.goals || '',
    professional_note: initialData?.professional_note || ''
  });

  const skinTypeOptions = ['Da thường', 'Da dầu', 'Da khô', 'Da hỗn hợp', 'Da nhạy cảm'];
  const concernOptions = ['Mụn', 'Nám', 'Tàn nhang', 'Sẹo rỗ', 'Sắc tố', 'Lão hóa', 'Da yếu', 'Viêm da', 'Lỗ chân lông to', 'Da không đều màu'];

  const toggleConcern = (concern: string) => {
    setFormData(prev => ({
      ...prev,
      skin_concerns: prev.skin_concerns.includes(concern) 
        ? prev.skin_concerns.filter((c: string) => c !== concern)
        : [...prev.skin_concerns, concern]
    }));
  };

  const handleSave = async () => {
    const now = new Date().toISOString();
    try {
      if (initialData?.id) {
        await skinProfileMutation.update(initialData.id, {
          ...formData,
          updated_at: now
        });
      } else {
        await skinProfileMutation.insert({
          shop_id: user?.shop_id || null,
          customer_id: customerId,
          ...formData,
          created_at: now,
          updated_at: now
        });
      }
      onClose();
    } catch (error) {
      console.error("Lỗi lưu hồ sơ da", error);
      alert("Có lỗi xảy ra khi lưu!");
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-6 border-b pb-3">
        {initialData ? 'Sửa Hồ sơ da' : 'Tạo Hồ sơ da mới'}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Loại da</label>
          <select 
            value={formData.skin_type}
            onChange={(e) => setFormData({...formData, skin_type: e.target.value})}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            {skinTypeOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mức độ tình trạng</label>
          <select 
            value={formData.severity}
            onChange={(e) => setFormData({...formData, severity: e.target.value})}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="Nhẹ">Nhẹ</option>
            <option value="Trung bình">Trung bình</option>
            <option value="Nặng">Nặng</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-2">Vấn đề da (Chọn nhiều)</label>
          <div className="flex flex-wrap gap-2">
            {concernOptions.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => toggleConcern(c)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  formData.skin_concerns.includes(c) 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 space-y-4 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sản phẩm đang dùng</label>
              <textarea 
                value={formData.current_products}
                onChange={(e) => setFormData({...formData, current_products: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mục tiêu điều trị</label>
              <textarea 
                value={formData.goals}
                onChange={(e) => setFormData({...formData, goals: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 text-red-600">Dị ứng / Chống chỉ định</label>
              <input 
                type="text"
                placeholder="Ví dụ: Hải sản, đang mang thai..."
                value={formData.contraindications}
                onChange={(e) => setFormData({...formData, contraindications: e.target.value})}
                className="w-full px-3 py-2 border border-red-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500 bg-red-50/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sản phẩm từng gây kích ứng</label>
              <input 
                type="text"
                value={formData.irritation_products}
                onChange={(e) => setFormData({...formData, irritation_products: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú chuyên môn (Bác sĩ/KTV)</label>
          <textarea 
            value={formData.professional_note}
            onChange={(e) => setFormData({...formData, professional_note: e.target.value})}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Ghi chú về phác đồ, tình trạng chi tiết..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-200">
        <button 
          onClick={onClose}
          className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
        >
          Hủy
        </button>
        <button 
          onClick={handleSave}
          className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors shadow-sm"
        >
          Lưu hồ sơ
        </button>
      </div>
    </div>
  );
}
