import { useState } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router';

/**
 * Components
 */
import { AppSidebar, AppContent, AppFooter } from './components';
import { AppHeader } from '@/shared/components/layout';

export const StoreDashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Layout hasSider>
      <AppSidebar collapsed={collapsed} />
      <Layout>
        <AppHeader
          collapsed={collapsed}
          onClick={toggleCollapsed}
        />
        <AppContent>
          <Outlet />
        </AppContent>
        <AppFooter />
      </Layout>
    </Layout>
  );
};
