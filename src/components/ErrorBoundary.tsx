import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    console.error('Curry Delight caught unhandled error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  private handleResetAll = () => {
    try {
      localStorage.removeItem('curry_delight_menu_items');
      localStorage.removeItem('curry_delight_settings');
      localStorage.removeItem('curry_delight_pos_orders');
      localStorage.removeItem('curry_delight_table_sessions');
      sessionStorage.removeItem('cd_pos_auth');
      localStorage.removeItem('cd_pos_auth');
    } catch {
      // ignore
    }
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FFF9F2] text-[#1A1613] flex flex-col items-center justify-center p-6 selection:bg-[#E8622C] selection:text-white">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-black/5 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#E8622C]/10 border border-[#E8622C]/20 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-[#E8622C]" />
            </div>

            <div className="space-y-2">
              <h1 className="font-serif font-bold text-2xl text-[#1A1613]">Curry Delight</h1>
              <p className="text-sm text-[#1A1613]/70">
                Something unexpected happened while rendering the page. Don't worry, your data is safe.
              </p>
              {this.state.error?.message && (
                <div className="bg-red-50 text-red-700 p-2.5 rounded-xl text-[11px] font-mono text-left overflow-x-auto border border-red-200">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="flex-1 bg-[#E8622C] hover:bg-[#d15423] text-white font-bold text-xs uppercase tracking-wider py-3.5 px-4 rounded-full transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reload Page</span>
                </button>

                <button
                  type="button"
                  onClick={this.handleHome}
                  className="flex-1 bg-[#1A1613]/5 hover:bg-[#1A1613]/10 text-[#1A1613] font-bold text-xs uppercase tracking-wider py-3.5 px-4 rounded-full transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </button>
              </div>

              <button
                type="button"
                onClick={this.handleResetAll}
                className="w-full text-center text-xs text-[#E8622C] hover:text-[#d15423] font-bold py-2 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Cache & Return to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
