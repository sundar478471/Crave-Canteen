import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
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

  public render() {
    if (this.state.hasError) {
      let message = "Something went wrong.";
      let details = this.state.error?.message;
      
      try {
        if (details) {
          const parsed = JSON.parse(details);
          if (parsed.error && parsed.error.includes('Missing or insufficient permissions')) {
            message = "Access Denied";
            details = "You do not have permission to access this data. If you are using a guest account, please log out and sign in with Google to access the full features.";
          }
        }
      } catch (e) {
        // Not JSON
      }

      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="bg-rose-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-rose-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-4">{message}</h1>
            <p className="text-sm text-slate-500 mb-8">{details}</p>
            <button
              onClick={() => {
                localStorage.removeItem('cravecanteen_user');
                window.location.reload();
              }}
              className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-black transition-all flex items-center justify-center"
            >
              <RefreshCcw className="w-5 h-5 mr-2" />
              Reset & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
