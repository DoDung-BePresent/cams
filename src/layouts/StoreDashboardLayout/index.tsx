import { useState } from 'react';
import { App, ConfigProvider, Layout } from 'antd';
import { Outlet } from 'react-router';

/**
 * Configs
 */
import { antTheme } from '@/config/theme';

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
    <ConfigProvider theme={antTheme}>
      <App>
        <Layout
          hasSider
          className='h-screen overflow-hidden'
          style={{
            background:
              'radial-gradient(circle at 18% 0%, rgba(127,29,29,0.34) 0%, rgba(127,29,29,0.08) 26%, transparent 48%), linear-gradient(135deg, #111113 0%, #161112 44%, #09090b 100%)',
          }}
        >
          <AppSidebar collapsed={collapsed} />
          <Layout
            style={{
              background:
                'radial-gradient(circle at 18% 0%, rgba(127,29,29,0.34) 0%, rgba(127,29,29,0.08) 26%, transparent 48%), linear-gradient(135deg, #111113 0%, #161112 44%, #09090b 100%)',
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
                background:
                  'radial-gradient(circle at 18% 0%, rgba(127,29,29,0.34) 0%, rgba(127,29,29,0.08) 26%, transparent 48%), linear-gradient(135deg, #111113 0%, #161112 44%, #09090b 100%)',
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
