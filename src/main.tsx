import React, { Component, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('MINISO Retail OS unhandled client exception:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#faf9f7] text-[#1a1c1b] p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-[#efeeec] shadow-xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#bb0012]/10 text-[#bb0012] flex items-center justify-center font-bold text-2xl">
              M
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight">MINISO Retail OS</h1>
              <p className="text-xs text-gray-500">Terminal encountered a runtime state sync error.</p>
            </div>
            {this.state.error?.message && (
              <div className="p-3 bg-red-50 border border-red-200/60 rounded-lg text-left text-xs font-mono text-red-700 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  window.location.reload();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#bb0012] hover:bg-[#a0000f] text-white font-semibold text-xs transition shadow-sm"
              >
                Reload Store Terminal
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.clear();
                  } catch (e) {}
                  window.location.reload();
                }}
                className="w-full py-2 px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-xs transition"
              >
                Reset Local Storage Cache &amp; Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
