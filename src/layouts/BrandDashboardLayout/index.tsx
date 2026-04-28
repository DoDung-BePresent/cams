/**
 * Node modules
 */
import { App, ConfigProvider, Layout } from 'antd';
import { Outlet } from 'react-router';
import { useState } from 'react';

/**
 * Configs
 */
import { antDarkTheme } from '@/config/theme';

/**
 * Components
 */
import { AppSidebar } from './components';
import { AppHeader } from '@/shared/components/layout';
import {
  ErrorBoundary,
  FeatureErrorFallback,
  StickyPlayer,
} from '@/shared/components';

export const BrandDashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  const handleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <ConfigProvider theme={antDarkTheme}>
      <App>
        <Layout
          hasSider
          className='h-screen overflow-hidden'
          style={{ background: '#000000' }}
        >
          <AppSidebar collapsed={collapsed} />
          <Layout
            style={{
              background: '#121212',
              marginLeft: 0,
              position: 'relative',
            }}
          >
            <AppHeader
              collapsed={collapsed}
              onClick={handleCollapsed}
            />
            <Layout.Content
              style={{
                height: 'calc(100vh - 60px)',
                background: '#121212',
                padding: '24px 32px 100px 32px', // added bottom padding for player
                overflowY: 'auto',
              }}
            >
              <ErrorBoundary
                fallback={
                  <FeatureErrorFallback featureName='Brand Dashboard' />
                }
              >
                <Outlet />
              </ErrorBoundary>
            </Layout.Content>
            <StickyPlayer />
          </Layout>
        </Layout>
      </App>
    </ConfigProvider>
  );
};
