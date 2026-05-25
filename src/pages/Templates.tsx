import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { MessageSquare, Plus, Copy, Check } from 'lucide-react';

export default function Templates() {
  const templates = useLiveQuery(() => db.message_templates.toArray()) || [];
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = (id: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddDemo = async () => {
    const now = new Date().toISOString();
    await db.message_templates.bulkAdd([
      { title: 'Chào khách mới', content: 'Chào anh/chị, em thấy mình đang quan tâm đến [sản phẩm]. Em xin phép hỏi thêm nhu cầu của mình để tư vấn đúng hơn ạ.', type: 'welcome', created_at: now, updated_at: now },
      { title: 'Nhắc sau mua 3 ngày', content: 'Chị ơi, em nhắn hỏi thăm sau vài ngày mình sử dụng [sản phẩm]. Mình dùng ổn không chị, có cần em hướng dẫn thêm không ạ?', type: 'post_purchase', created_at: now, updated_at: now },
      { title: 'Nhắc mua lại', content: 'Chị ơi, sản phẩm mình dùng cũng gần đến chu kỳ tiếp theo rồi. Em nhắn để hỗ trợ mình đặt lại cho kịp ạ.', type: 'repurchase', created_at: now, updated_at: now }
    ]);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Mẫu tin nhắn nhanh</h1>
        <button 
          onClick={handleAddDemo}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Thêm mẫu mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(template => (
          <div key={template.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-blue-300 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                {template.title}
              </h3>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium">
                {template.type === 'welcome' ? 'Chào hỏi' : template.type === 'post_purchase' ? 'Sau mua' : 'Mua lại'}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg text-slate-700 text-sm border border-slate-100 min-h-[80px]">
              {template.content}
            </div>
            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => handleCopy(template.id!, template.content)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  copiedId === template.id 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {copiedId === template.id ? <><Check className="w-4 h-4" /> Đã copy</> : <><Copy className="w-4 h-4" /> Copy</>}
              </button>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-500 flex flex-col items-center">
            <MessageSquare className="w-10 h-10 text-slate-300 mb-3" />
            <p>Chưa có mẫu tin nhắn nào.</p>
            <button onClick={handleAddDemo} className="mt-4 text-blue-600 font-medium hover:underline">
              Tạo dữ liệu mẫu ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
