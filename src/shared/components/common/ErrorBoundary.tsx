import { Component, type ReactNode } from 'react';
import { Result, Button } from 'antd';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='flex h-screen items-center justify-center'>
          <Result
            status='500'
            title='Oops! Something went wrong'
            subTitle='We encountered an unexpected error. Please try refreshing the page.'
            extra={
              <Button
                type='primary'
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}
