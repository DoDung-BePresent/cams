import { Flex, Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router';
import { useMemo } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';

/**
 * Shared
 */
import { ROLES } from '@/shared/constants/rolesConstants';
import { Logo } from '@/shared/components/common/Logo';
import { cn } from '@/shared/lib/utils';

/**
 * Providers
 */
import { useAuth } from '@/providers/AuthProvider';

/**
 * Features
 */
import { adminMenuItems } from '@/features/admin/constants/adminMenuItems';
import { managerMenuItems } from '@/features/manager/constants/managerMenuItems';

/**
 * Components
 */
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
  const location = useLocation();

  const menuItems =
    user?.role === ROLES.SYSTEM_ADMIN ? adminMenuItems : managerMenuItems;

  const routeMap: Record<string, string> = {
    // Admin routes
    'admin-dashboard': '/admin/dashboard',
    'brand-management': '/admin/brands',
    'account-management': '/admin/accounts',
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
    spaces: '/manager/spaces',
    devices: '/manager/devices',
    'auto-manual-mode': '/manager/music-control/mode',
    'playback-control': '/manager/music-control/playback',
    'time-based-rules': '/manager/schedule/time-based',
    'event-based-rules': '/manager/schedule/event-based',
    'music-vs-sales': '/manager/reports/music-sales',
    'customer-engagement': '/manager/reports/engagement',
    'playback-history': '/manager/reports/history',
    settings: '/manager/settings',
  };

  const pathToKeyMap = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(routeMap).forEach(([key, path]) => {
      map[path] = key;
    });
    return map;
  }, []);

  const selectedKeys = useMemo(() => {
    const currentPath = location.pathname;

    if (pathToKeyMap[currentPath]) {
      return [pathToKeyMap[currentPath]];
    }

    const matchedKey = Object.entries(routeMap).find(([_, path]) =>
      currentPath.startsWith(path),
    )?.[0];

    return matchedKey ? [matchedKey] : [];
  }, [location.pathname, pathToKeyMap, routeMap]);

  const openKeys = useMemo(() => {
    const keys: string[] = [];

    const findParentKey = (items: any[], targetKey: string): string | null => {
      for (const item of items) {
        if (item.children) {
          const child = item.children.find((c: any) => c.key === targetKey);
          if (child) return item.key;

          const nested = findParentKey(item.children, targetKey);
          if (nested) return item.key;
        }
      }
      return null;
    };

    if (selectedKeys.length > 0) {
      const parentKey = findParentKey(menuItems, selectedKeys[0]);
      if (parentKey) keys.push(parentKey);
    }

    return keys;
  }, [selectedKeys, menuItems]);

  const handleMenuClick = (key: string) => {
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
          selectedKeys={selectedKeys}
          defaultOpenKeys={openKeys}
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
        />
        {!collapsed && <NavCard />}
      </SimpleBar>
    </Sider>
  );
};
