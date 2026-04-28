import { useState } from 'react';
import { App, ConfigProvider, Layout } from 'antd';
import { Outlet } from 'react-router';

/**
 * Configs
 */
import { antDarkTheme } from '@/config/theme';

/**
 * Components
 */
import { AppSidebar, AppFooter } from './components';
import { AppHeader } from '@/shared/components/layout';
import {
  ErrorBoundary,
  FeatureErrorFallback,
  StickyPlayer,
} from '@/shared/components';

export const StoreDashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => {
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
              onClick={toggleCollapsed}
            />
            <Layout.Content
              style={{
                height: 'calc(100vh - 60px)',
                background: '#121212',
                padding: '24px 32px 100px 32px', // Bottom padding for StickyPlayer
                overflowY: 'auto',
              }}
            >
              <ErrorBoundary
                fallback={
                  <FeatureErrorFallback featureName='Store Dashboard' />
                }
              >
                <Outlet />
              </ErrorBoundary>
              <AppFooter />
            </Layout.Content>
            <StickyPlayer />
          </Layout>
        </Layout>
      </App>
    </ConfigProvider>
  );
};
