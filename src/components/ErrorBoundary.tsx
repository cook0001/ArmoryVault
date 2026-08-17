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
 * Catches unhandled React component errors and renders a recovery UI
 * instead of leaving the user staring at a blank white screen.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '/';
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: '2rem',
          textAlign: 'center',
          gap: '1.5rem',
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <AlertTriangle size={40} color="#f87171" />
          </div>

          <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
            Something went wrong
          </h2>

          <p style={{ margin: 0, color: 'var(--text-secondary)', maxWidth: '500px', lineHeight: 1.6 }}>
            An unexpected error occurred. You can try again or return to the dashboard.
          </p>

          {this.state.error && (
            <details style={{
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              padding: '1rem',
              maxWidth: '600px',
              width: '100%',
              textAlign: 'left',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Error Details
              </summary>
              <code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {this.state.error.message}
              </code>
            </details>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button
              className="btn-secondary"
              onClick={this.handleReset}
              style={{ padding: '0.6rem 1.5rem' }}
            >
              Try Again
            </button>
            <button
              className="btn-primary"
              onClick={this.handleGoHome}
              style={{ padding: '0.6rem 1.5rem' }}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
