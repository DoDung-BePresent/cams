import { useState } from 'react';
import { Layout } from 'antd';

/**
 * Components
 */
import { AppHeader, AppSidebar, AppContent, AppFooter } from './components';
import { Outlet } from 'react-router';

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
