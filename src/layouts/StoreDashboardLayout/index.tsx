import { useState } from 'react';
import { Layout } from 'antd';

/**
 * Components
 */
import { AppHeader, AppSidebar, AppContent, AppFooter } from './components';

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
          onToggle={toggleCollapsed}
        />
        <AppContent />
        <AppFooter />
      </Layout>
    </Layout>
  );
};
