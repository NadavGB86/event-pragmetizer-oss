import React from 'react';
import { AlertOctagon } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: ErrorBoundaryProps;
  public state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-8 text-center">
           <AlertOctagon className="w-16 h-16 text-red-500 mb-6" />
           <h1 className="text-3xl font-bold text-slate-800 mb-2">Something went wrong</h1>
           <p className="text-slate-600 mb-8 max-w-lg">
             The application encountered an unexpected error.
             <br/>
             <span className="font-mono text-xs bg-slate-200 p-1 rounded mt-2 inline-block">
               {this.state.error?.message}
             </span>
           </p>
           <button
             onClick={() => { localStorage.clear(); globalThis.location.reload(); }}
             className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
           >
             Clear Data & Reload
           </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
