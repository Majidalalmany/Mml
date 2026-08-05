import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-rose-200 text-center space-y-4 my-6 dir-rtl" dir="rtl">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-slate-800">
              {this.props.fallbackTitle || 'حدث خطأ غير متوقع في عرض هذه الوحدة'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed dir-ltr text-left bg-slate-50 p-2.5 rounded-lg border border-slate-200 overflow-x-auto max-h-24">
              {this.state.error?.message || 'Unknown error occurred'}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>إعادة تحميل الوحدة</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
