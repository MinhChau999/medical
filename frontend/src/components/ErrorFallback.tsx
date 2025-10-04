import { Result, Button, Typography } from 'antd';
import { FrownOutlined, ReloadOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Paragraph, Text } = Typography;

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  message?: string;
  showDetails?: boolean;
}

export function ErrorFallback({
  error,
  resetError,
  title = 'Something went wrong',
  message = 'We encountered an unexpected error. Please try again.',
  showDetails = false,
}: ErrorFallbackProps) {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
    resetError?.();
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6">
        <Result
          icon={<FrownOutlined />}
          status="error"
          title={title}
          subTitle={message}
          extra={[
            <Button
              type="primary"
              key="home"
              icon={<HomeOutlined />}
              onClick={handleGoHome}
            >
              Go Home
            </Button>,
            <Button
              key="reload"
              icon={<ReloadOutlined />}
              onClick={handleReload}
            >
              Reload Page
            </Button>,
          ]}
        >
          {showDetails && error && (
            <div className="mt-6 p-4 bg-red-50 rounded-lg text-left">
              <Paragraph>
                <Text strong className="text-red-800">Error:</Text>
                <pre className="mt-2 text-sm text-red-600 whitespace-pre-wrap">
                  {error.message}
                </pre>
              </Paragraph>
            </div>
          )}
        </Result>
      </div>
    </div>
  );
}

export function NotFoundError() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            Back Home
          </Button>
        }
      />
    </div>
  );
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Result
        status="500"
        title="Network Error"
        subTitle="Unable to connect to the server. Please check your connection."
        extra={
          <Button type="primary" onClick={onRetry}>
            Try Again
          </Button>
        }
      />
    </div>
  );
}

export function UnauthorizedError() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Result
        status="403"
        title="403"
        subTitle="Sorry, you are not authorized to access this page."
        extra={
          <Button type="primary" onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        }
      />
    </div>
  );
}
