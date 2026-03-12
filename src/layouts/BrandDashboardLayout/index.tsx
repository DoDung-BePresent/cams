/**
 * Node modules
 */
import { Layout } from 'antd';
import { Outlet } from 'react-router';
import { useState } from 'react';

/**
 * Features
 */
import { MusicPlayer } from '@/features/brand/components';

/**
 * Components
 */
import { AppSidebar, AppHeader, AppFooter, AppContent } from './components';

export const BrandDashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  const handleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Layout hasSider>
      <AppSidebar collapsed={collapsed} />
      <Layout>
        <AppHeader
          collapsed={collapsed}
          onClick={handleCollapsed}
        />
        <AppContent>
          <Outlet />
        </AppContent>
        <AppFooter />
        <MusicPlayer sidebarCollapsed={collapsed} />
      </Layout>
    </Layout>
  );
};
