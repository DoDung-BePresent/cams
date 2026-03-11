import { Flex, Layout, Menu } from 'antd';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';

/**
 * Shared
 */
import { ROLES } from '@/shared/constants/rolesConstants';
import { Logo } from '@/shared/components/common/Logo';
import { cn } from '@/shared/lib/utils';

/**
 * Hooks
 */
import { useAuth } from '@/providers/AuthProvider';
import { useMenuNavigation } from '@/shared/hooks/useMenuNavigation';

/**
 * Features
 */
import { adminMenuItems } from '@/features/admin/constants/adminMenuItems';
import { ADMIN_ROUTE_MAP } from '@/features/admin/constants/adminRouteMap';
import { brandMenuItems } from '@/features/brand/constants/brandMenuItems';
import { BRAND_ROUTE_MAP } from '@/features/brand/constants/brandRouteMap';

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

  const isAdmin = user?.role === ROLES.SYSTEM_ADMIN;
  // FIXME: It's a bit redundant because we know that only person with SystemAdmin role can access this layout!
  const menuItems = isAdmin ? adminMenuItems : brandMenuItems;
  const routeMap = isAdmin ? ADMIN_ROUTE_MAP : BRAND_ROUTE_MAP;

  const { selectedKeys, openKeys, handleMenuClick } = useMenuNavigation({
    menuItems,
    routeMap,
  });

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
