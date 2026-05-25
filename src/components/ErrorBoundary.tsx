import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    window.location.reload();
  };

  private handleClearData = async () => {
    if (window.confirm('Hành động này sẽ XÓA TOÀN BỘ DỮ LIỆU CỤC BỘ (Local Database) và khôi phục ứng dụng về trạng thái ban đầu. Bạn có chắc chắn muốn tiếp tục?')) {
      try {
        // Xóa IndexedDB
        const dbs = await window.indexedDB.databases();
        dbs.forEach(db => {
          if (db.name) window.indexedDB.deleteDatabase(db.name);
        });
        
        // Xóa Local Storage
        window.localStorage.clear();
        
        alert('Đã xóa dữ liệu thành công! Ứng dụng sẽ tự động khởi động lại.');
        window.location.href = '/';
      } catch (e) {
        console.error('Failed to clear data', e);
        alert('Có lỗi xảy ra khi xóa dữ liệu.');
      }
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-red-100 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Đã xảy ra lỗi hệ thống!</h1>
            <p className="text-slate-600 mb-6">
              Ứng dụng gặp sự cố trong quá trình khởi tạo giao diện hoặc nâng cấp phiên bản cơ sở dữ liệu.
            </p>
            
            <div className="bg-slate-100 p-4 rounded-lg text-left mb-8 overflow-auto max-h-32">
              <code className="text-xs text-slate-700 break-words">
                {this.state.error?.message || 'Unknown render error'}
              </code>
            </div>

            <div className="space-y-3">
              <button 
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Thử tải lại ứng dụng
              </button>
              
              <button 
                onClick={this.handleClearData}
                className="w-full flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-medium py-2.5 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Sửa lỗi: Khôi phục Dữ liệu Cục bộ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
