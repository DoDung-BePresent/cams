import { Flex, Layout, Menu } from 'antd';
import { useNavigate } from 'react-router';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { Logo } from '@/shared/components/common/Logo';
import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { ROLES } from '@/shared/constants/roles';
import { adminMenuItems } from '@/features/admin/constants/adminMenuItems';
import { managerMenuItems } from '@/features/manager/constants/managerMenuItems';
import { NavCard } from './NavCard';

type AppSidebarProps = {
  collapsed: boolean;
};

const { Sider } = Layout;

const siderStyle: React.CSSProperties = {
  overflowY: 'hidden',
  height: '100vh',
  position: 'sticky',
  insetInlineStart: 0,
  top: 0,
  left: 0,
  bottom: 0,
  borderRight: '1px solid #F0F0F0',
};

export const AppSidebar = ({ collapsed }: AppSidebarProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const menuItems =
    user?.role === ROLES.ADMIN ? adminMenuItems : managerMenuItems;

  // Update handleMenuClick function
  const handleMenuClick = (key: string) => {
    const routeMap: Record<string, string> = {
      // Admin routes
      'admin-dashboard': '/admin/dashboard',
      'store-management': '/admin/stores',
      'user-management': '/admin/users',
      'music-library': '/admin/music',
      'playlist-templates': '/admin/playlists',
      'mood-genre-tags': '/admin/tags',
      'rule-settings': '/admin/ai/rules',
      'external-ai-music-api': '/admin/ai/api',
      'data-mapping': '/admin/pos/mapping',
      'sync-status': '/admin/pos/sync',
      'music-decision-logs': '/admin/logs/music-decisions',
      'api-call-logs': '/admin/logs/api-calls',
      'error-logs': '/admin/logs/errors',

      // Manager routes
      dashboard: '/manager/dashboard',
      spaces: '/manager/spaces', // NEW
      devices: '/manager/devices', // NEW
      'auto-manual-mode': '/manager/music-control/mode',
      'playback-control': '/manager/music-control/playback',
      'time-based-rules': '/manager/schedule/time-based',
      'event-based-rules': '/manager/schedule/event-based',
      'music-vs-sales': '/manager/reports/music-sales',
      'customer-engagement': '/manager/reports/engagement',
      'playback-history': '/manager/reports/history',
      settings: '/manager/settings',
    };

    const route = routeMap[key];
    if (route) {
      navigate(route);
    }
  };

  return (
    <Sider
      trigger={null}
      style={siderStyle}
      theme='light'
      width={260}
      collapsedWidth={60}
      collapsible
      collapsed={collapsed}
    >
      <Flex className={cn('p-4!', collapsed && 'px-2.5!')}>
        <Logo isIcon={collapsed} />
      </Flex>
      <SimpleBar
        style={{ maxHeight: '100vh' }}
        className='custom-sidebar-scrollbar'
      >
        <Menu
          theme='light'
          mode='inline'
          className='border-none!'
          defaultSelectedKeys={['dashboard']}
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
        />
        {!collapsed && <NavCard />}
      </SimpleBar>
    </Sider>
  );
};
