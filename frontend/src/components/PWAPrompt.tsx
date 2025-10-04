import { Button, Alert, Space } from 'antd';
import { DownloadOutlined, CloseOutlined, ReloadOutlined, WifiOutlined } from '@ant-design/icons';
import { usePWA, useOnlineStatus } from '@/hooks/usePWA';

export function PWAPrompt() {
  const {
    needRefresh,
    offlineReady,
    showInstallPrompt,
    installPWA,
    dismissInstallPrompt,
    updateApp,
  } = usePWA();

  return (
    <>
      {/* Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
          <Alert
            message="Install App"
            description="Install Medical Electronics app for a better experience with offline support."
            type="info"
            showIcon
            icon={<DownloadOutlined />}
            action={
              <Space direction="vertical">
                <Button
                  size="small"
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={installPWA}
                >
                  Install
                </Button>
                <Button
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={dismissInstallPrompt}
                >
                  Dismiss
                </Button>
              </Space>
            }
            closable
            onClose={dismissInstallPrompt}
          />
        </div>
      )}

      {/* Update Available */}
      {needRefresh && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
          <Alert
            message="Update Available"
            description="A new version is available. Please update to get the latest features."
            type="warning"
            showIcon
            icon={<ReloadOutlined />}
            action={
              <Button
                size="small"
                type="primary"
                icon={<ReloadOutlined />}
                onClick={updateApp}
              >
                Update Now
              </Button>
            }
            closable
          />
        </div>
      )}

      {/* Offline Ready */}
      {offlineReady && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
          <Alert
            message="Ready for Offline Use"
            description="App is ready to work offline!"
            type="success"
            showIcon
            closable
          />
        </div>
      )}
    </>
  );
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <Alert
        message="You are currently offline"
        description="Some features may be limited. Changes will sync when connection is restored."
        type="warning"
        showIcon
        icon={<WifiOutlined />}
        banner
      />
    </div>
  );
}
