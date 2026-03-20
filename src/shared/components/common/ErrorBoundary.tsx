import { Component, type ReactNode } from 'react';
import { Result, Button } from 'antd';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary - Catches React errors and displays fallback UI
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 *
 * With custom fallback:
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);

    // TODO: Send to monitoring service (Sentry, LogRocket, etc.)
    // Example:
    // monitoringService.logError(error, {
    //   componentStack: errorInfo.componentStack,
    //   errorBoundary: true,
    // });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{ padding: '48px 24px', maxWidth: 600, margin: '0 auto' }}>
          <Result
            status='error'
            title='Something went wrong'
            subTitle='An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.'
            extra={[
              <Button
                key='refresh'
                type='primary'
                size='large'
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>,
              <Button
                key='reset'
                size='large'
                onClick={this.handleReset}
              >
                Try Again
              </Button>,
            ]}
          />
          {import.meta.env.DEV && this.state.error && (
            <details
              style={{
                marginTop: 24,
                padding: 16,
                background: '#f5f5f5',
                borderRadius: 4,
              }}
            >
              <summary
                style={{ cursor: 'pointer', fontWeight: 600, marginBottom: 8 }}
              >
                Error Details (Dev Only)
              </summary>
              <pre style={{ fontSize: 12, overflow: 'auto' }}>
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
