/**
 * Node modules
 */
import { App, ConfigProvider, Layout } from 'antd';
import { Outlet } from 'react-router';
import { useState } from 'react';

/**
 * Configs
 */
import { antTheme } from '@/config/theme';

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
              onClick={handleCollapsed}
            />
            <Layout.Content
              style={{
                height: 'calc(100vh - 60px)',
                background:
                  'radial-gradient(circle at 18% 0%, rgba(127,29,29,0.34) 0%, rgba(127,29,29,0.08) 26%, transparent 48%), linear-gradient(135deg, #111113 0%, #161112 44%, #09090b 100%)',
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
