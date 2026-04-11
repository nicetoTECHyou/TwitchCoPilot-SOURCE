import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — catches uncaught rendering errors and shows a recovery UI
 * instead of a white screen. Bilingual German/English.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const message = this.state.error.message || String(this.state.error);
      const truncated = message.length > 200 ? message.slice(0, 200) + '…' : message;

      return (
        <div className="flex items-center justify-center min-h-screen w-screen bg-background p-4">
          <div className="max-w-md w-full rounded-xl border border-border bg-surface p-6 text-center space-y-4 shadow-lg">
            <div className="mx-auto flex items-center justify-center size-14 rounded-full bg-danger/10">
              <AlertTriangle className="size-7 text-danger" />
            </div>
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-foreground">
                Etwas ist schiefgelaufen
              </h1>
              <p className="text-sm text-muted-foreground">
                Something went wrong
              </p>
            </div>
            <div className="rounded-lg bg-background border border-border p-3 text-left">
              <p className="text-xs font-mono text-foreground/70 break-words">
                {truncated}
              </p>
            </div>
            <button
              onClick={this.handleReload}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Seite neu laden / Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
