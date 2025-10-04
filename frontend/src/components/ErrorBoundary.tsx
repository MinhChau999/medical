import { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button } from 'antd';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // You can also log to an error reporting service here
    // Example: logErrorToService(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-2xl w-full">
            <Result
              status="error"
              title="Oops! Something went wrong"
              subTitle="We're sorry for the inconvenience. Please try refreshing the page."
              extra={[
                <Button type="primary" key="reload" onClick={this.handleReload}>
                  Reload Page
                </Button>,
                <Button key="reset" onClick={this.handleReset}>
                  Try Again
                </Button>,
              ]}
            >
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-8 p-4 bg-red-50 rounded-lg text-left">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    Error Details (Development Only)
                  </h3>
                  <pre className="text-sm text-red-600 overflow-auto">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.errorInfo && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-red-700 font-medium">
                        Component Stack
                      </summary>
                      <pre className="mt-2 text-xs text-red-600 overflow-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </Result>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
