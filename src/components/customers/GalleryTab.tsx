import { useState } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabase';
import { useAuthStore } from '../../store/authStore';
import { Image as ImageIcon, Plus, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function GalleryTab({ customerId }: { customerId: number }) {
  const { data: images = [], loading } = useSupabaseQuery<any>({ table: 'before_after_images', eq: { customer_id: customerId }, order: { column: 'created_at', ascending: false } });
  const galleryMutation = useSupabaseMutation('before_after_images');

  const [isUploading, setIsUploading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'before' | 'progress' | 'after'>('all');

  if (loading) {
    return <div className="p-4 text-center text-slate-500">Đang tải...</div>;
  }

  const filteredImages = images.filter(img => filter === 'all' || img.image_type === filter);

  const handleDelete = async (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa ảnh này?")) {
      await galleryMutation.delete(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-sm font-medium rounded-full ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Tất cả</button>
          <button onClick={() => setFilter('before')} className={`px-3 py-1.5 text-sm font-medium rounded-full ${filter === 'before' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>Before</button>
          <button onClick={() => setFilter('progress')} className={`px-3 py-1.5 text-sm font-medium rounded-full ${filter === 'progress' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}>Progress</button>
          <button onClick={() => setFilter('after')} className={`px-3 py-1.5 text-sm font-medium rounded-full ${filter === 'after' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>After</button>
        </div>
        {!isUploading && (
          <button 
            onClick={() => setIsUploading(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Tải ảnh lên
          </button>
        )}
      </div>

      {isUploading && (
        <UploadImageForm customerId={customerId} onClose={() => setIsUploading(false)} />
      )}

      {filteredImages.length === 0 && !isUploading && (
        <div className="text-center py-10 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
          <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <div className="text-slate-500">Chưa có ảnh nào trong thư viện.</div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredImages.map(img => (
          <div key={img.id} className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="aspect-square bg-slate-100 relative">
              <img src={img.image_url} alt="Gallery" className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 flex gap-1">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded shadow-sm text-white ${
                  img.image_type === 'before' ? 'bg-red-500' :
                  img.image_type === 'after' ? 'bg-green-500' :
                  'bg-orange-500'
                }`}>
                  {img.image_type}
                </span>
                {img.treatment_area && (
                  <span className="text-[10px] bg-black/60 text-white px-2 py-0.5 rounded shadow-sm">
                    {img.treatment_area}
                  </span>
                )}
              </div>
              <button 
                onClick={() => handleDelete(img.id as number)}
                className="absolute top-2 right-2 bg-white/90 text-red-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(img.capture_date), 'dd/MM/yyyy')}
              </div>
              {img.note && <p className="text-sm text-slate-700 mt-1 line-clamp-2">{img.note}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UploadImageForm({ customerId, onClose }: { customerId: number, onClose: () => void }) {
  const user = useAuthStore(state => state.user);
  const galleryMutation = useSupabaseMutation('before_after_images');
  
  const [formData, setFormData] = useState({
    image_type: 'before',
    treatment_area: 'Mặt',
    capture_date: format(new Date(), 'yyyy-MM-dd'),
    note: ''
  });
  const [base64Image, setBase64Image] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit for local Dexie
        alert("Vui lòng chọn ảnh nhỏ hơn 2MB để tránh nặng máy (Bản Cloud sẽ không giới hạn).");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64Image(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!base64Image) {
      return alert("Vui lòng chọn ảnh!");
    }

    const now = new Date().toISOString();
    await galleryMutation.insert({
      shop_id: user?.shop_id || null,
      customer_id: customerId,
      image_url: base64Image,
      image_type: formData.image_type,
      treatment_area: formData.treatment_area,
      capture_date: formData.capture_date,
      note: formData.note,
      created_at: now
    });
    onClose();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Tải ảnh mới lên</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors relative overflow-hidden">
            {base64Image ? (
              <>
                <img src={base64Image} alt="Preview" className="mx-auto h-40 object-contain rounded" />
                <button 
                  onClick={() => setBase64Image(null)}
                  className="absolute top-2 right-2 bg-red-100 text-red-600 p-1.5 rounded-full"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <label className="cursor-pointer block py-8">
                <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-sm font-medium text-blue-600">Bấm để chọn ảnh</span>
                <p className="text-xs text-slate-500 mt-1">Hỗ trợ JPG, PNG (Max 2MB)</p>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Loại ảnh</label>
            <select 
              value={formData.image_type}
              onChange={(e) => setFormData({...formData, image_type: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="before">Before (Trước khi làm)</option>
              <option value="progress">Progress (Đang liệu trình)</option>
              <option value="after">After (Sau khi làm)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Vùng điều trị</label>
            <input 
              type="text"
              placeholder="VD: Trán, 2 má, Cằm..."
              value={formData.treatment_area}
              onChange={(e) => setFormData({...formData, treatment_area: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ngày chụp</label>
            <input 
              type="date"
              value={formData.capture_date}
              onChange={(e) => setFormData({...formData, capture_date: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
            <input 
              type="text"
              placeholder="VD: Mụn sưng viêm nhiều..."
              value={formData.note}
              onChange={(e) => setFormData({...formData, note: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
        <button onClick={onClose} className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium">Hủy</button>
        <button onClick={handleSave} className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow-sm">Lưu ảnh</button>
      </div>
    </div>
  );
}
