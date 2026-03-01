import { Alert } from 'antd';

/**
 * Icons
 */
import { WifiOutlined, DisconnectOutlined } from '@ant-design/icons';

/**
 * Hooks
 */
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';

export const NetworkStatusBanner = () => {
  const { isOnline, isSlowConnection } = useNetworkStatus();

  if (isOnline && !isSlowConnection) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        animation: 'slideDown 0.3s ease-out',
      }}
    >
      {!isOnline ? (
        <Alert
          description='You are offline. Some features are unavailable. Changes will sync when connection is restored.'
          type='error'
          icon={<DisconnectOutlined />}
          banner
          showIcon
          className='border-b-2! border-[var(--ant-color-error)]!'
        />
      ) : isSlowConnection ? (
        <Alert
          description='Your internet connection is slow. Some features may take longer to load.'
          type='warning'
          icon={<WifiOutlined />}
          banner
          showIcon
          className='border-b-2! border-[var(--ant-color-warning)]!'
        />
      ) : null}
    </div>
  );
};
