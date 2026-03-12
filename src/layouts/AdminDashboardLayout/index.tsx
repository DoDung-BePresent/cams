/**
 * Node modules
 */
import { Layout } from 'antd';
import { Outlet } from 'react-router';
import { useState } from 'react';

/**
 * Components
 */
import { AppSidebar, AppHeader, AppFooter, AppContent } from './components';

export const AdminDashboardLayout = () => {
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
      </Layout>
    </Layout>
  );
};
