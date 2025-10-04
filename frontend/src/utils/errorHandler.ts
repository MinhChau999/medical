import { message } from 'antd';
import axios, { AxiosError } from 'axios';

export interface ErrorLog {
  timestamp: string;
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  error: Error;
}

class ErrorHandler {
  private errorLogs: ErrorLog[] = [];
  private maxLogs = 50;

  /**
   * Handle global errors
   */
  handleError(error: Error, errorInfo?: React.ErrorInfo) {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      error,
    };

    this.logError(errorLog);
    this.showUserFeedback(error);

    // Send to logging service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(errorLog);
    }
  }

  /**
   * Handle API errors
   */
  handleApiError(error: unknown) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;

      if (axiosError.response) {
        const status = axiosError.response.status;
        const errorMessage = axiosError.response.data?.message || 'An error occurred';

        switch (status) {
          case 400:
            message.error(errorMessage || 'Bad request');
            break;
          case 401:
            message.error('Unauthorized. Please login again.');
            // Redirect to login if needed
            window.location.href = '/login';
            break;
          case 403:
            message.error('You do not have permission to perform this action');
            break;
          case 404:
            message.error('Resource not found');
            break;
          case 422:
            message.error(errorMessage || 'Validation error');
            break;
          case 429:
            message.error('Too many requests. Please try again later');
            break;
          case 500:
            message.error('Server error. Please try again later');
            break;
          case 503:
            message.error('Service unavailable. Please try again later');
            break;
          default:
            message.error(errorMessage || 'An unexpected error occurred');
        }

        this.logError({
          timestamp: new Date().toISOString(),
          message: errorMessage,
          url: axiosError.config?.url || '',
          userAgent: navigator.userAgent,
          error: error as Error,
        });
      } else if (axiosError.request) {
        message.error('Network error. Please check your connection.');
      } else {
        message.error('An unexpected error occurred');
      }
    } else if (error instanceof Error) {
      message.error(error.message);
      this.handleError(error);
    } else {
      message.error('An unexpected error occurred');
    }
  }

  /**
   * Show user-friendly feedback
   */
  private showUserFeedback(error: Error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error:', error);
    }

    // Show toast notification
    message.error('Something went wrong. Please try again.');
  }

  /**
   * Log error to local storage
   */
  private logError(errorLog: ErrorLog) {
    this.errorLogs.push(errorLog);

    // Keep only recent logs
    if (this.errorLogs.length > this.maxLogs) {
      this.errorLogs.shift();
    }

    // Save to localStorage for debugging
    try {
      localStorage.setItem('error_logs', JSON.stringify(this.errorLogs));
    } catch (e) {
      console.error('Failed to save error logs:', e);
    }
  }

  /**
   * Send error to logging service (Sentry, LogRocket, etc.)
   */
  private sendToLoggingService(errorLog: ErrorLog) {
    // Example: Send to your backend
    // fetch('/api/logs/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorLog),
    // }).catch(console.error);

    // Example: Sentry
    // Sentry.captureException(errorLog.error, {
    //   contexts: {
    //     error: errorLog,
    //   },
    // });

    console.log('Error logged:', errorLog);
  }

  /**
   * Get all error logs
   */
  getErrorLogs(): ErrorLog[] {
    return this.errorLogs;
  }

  /**
   * Clear error logs
   */
  clearErrorLogs() {
    this.errorLogs = [];
    localStorage.removeItem('error_logs');
  }

  /**
   * Load error logs from localStorage
   */
  loadErrorLogs() {
    try {
      const logs = localStorage.getItem('error_logs');
      if (logs) {
        this.errorLogs = JSON.parse(logs);
      }
    } catch (e) {
      console.error('Failed to load error logs:', e);
    }
  }
}

export const errorHandler = new ErrorHandler();

// Setup global error handlers
export function setupGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    errorHandler.handleError(
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason))
    );
    event.preventDefault();
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    errorHandler.handleError(event.error || new Error(event.message));
    event.preventDefault();
  });

  // Load existing error logs
  errorHandler.loadErrorLogs();
}

// Export singleton instance
export default errorHandler;
