import { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
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
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center text-[#111111]">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-4 shadow-xs">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#00215C] tracking-tight">
            {this.props.fallbackTitle || 'Something went wrong'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed font-normal">
            An unexpected error occurred while displaying this section. Please reload to restore your practice session.
          </p>
          <button
            onClick={this.handleReset}
            className="mt-6 px-6 py-2.5 rounded-xl bg-[#00215C] hover:bg-[#143471] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reload Module</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
