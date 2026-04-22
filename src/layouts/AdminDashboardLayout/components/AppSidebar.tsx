import { Flex, Layout, Menu, theme } from 'antd';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';

/**
 * Libs
 */
import { cn } from '@/shared/lib';

/**
 * Hooks
 */
import { useMenuNavigation } from '@/shared/hooks';
import { useThemeMode } from '@/providers';

/**
 * Constants
 */
import { ADMIN_MENU_ITEMS, ADMIN_ROUTE_MAP } from '@/features/admin/constants';

/**
 * Components
 */
import { NavCard, Logo } from '@/shared/components';

/**
 * Configs
 */
import { SIDEBAR_WIDTHS } from '@/config';

type AppSidebarProps = {
  collapsed: boolean;
};

const { Sider } = Layout;
const { useToken } = theme;

const siderStyle: React.CSSProperties = {
  overflowY: 'hidden',
  height: '100vh',
  position: 'sticky',
  insetInlineStart: 0,
  top: 0,
  left: 0,
  bottom: 0,
  borderRight: '1px solid var(--app-border-color)',
  background: 'var(--app-sidebar-bg)',
};

export const AppSidebar = ({ collapsed }: AppSidebarProps) => {
  const { isSpotifyMode } = useThemeMode();
  const { token } = useToken();
  const { selectedKeys, openKeys, handleMenuClick } = useMenuNavigation({
    menuItems: ADMIN_MENU_ITEMS,
    routeMap: ADMIN_ROUTE_MAP,
  });

  return (
    <Sider
      trigger={null}
      style={siderStyle}
      theme={isSpotifyMode ? 'dark' : 'light'}
      width={SIDEBAR_WIDTHS.width}
      collapsedWidth={SIDEBAR_WIDTHS.collapsedWidth}
      collapsible
      collapsed={collapsed}
    >
      <Flex className={cn('p-2.5! px-3.5!', collapsed && 'px-2.5!')}>
        <Logo isIcon={collapsed} />
      </Flex>
      <SimpleBar
        style={{ height: 'calc(100vh - 60px)' }}
        className='custom-sidebar-scrollbar'
      >
        <Menu
          theme={isSpotifyMode ? 'dark' : 'light'}
          mode='inline'
          className='border-none!'
          selectedKeys={selectedKeys}
          defaultOpenKeys={openKeys}
          items={ADMIN_MENU_ITEMS}
          onClick={({ key }) => handleMenuClick(key)}
          style={{
            backgroundColor: token.Layout?.siderBg,
          }}
        />
        {!collapsed && <NavCard />}
      </SimpleBar>
    </Sider>
  );
};
