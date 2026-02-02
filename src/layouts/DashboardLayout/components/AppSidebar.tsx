import { Flex, Layout, Menu } from 'antd';
import { useNavigate } from 'react-router';
import { Logo } from '@/shared/components/common/Logo';
import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { ROLES } from '@/shared/constants/roles';
import { adminMenuItems } from '@/features/admin/components/AdminSidebar/adminMenuItems';
import { managerMenuItems } from '@/features/manager/components/ManagerSidebar/managerMenuItems';

type AppSidebarProps = {
  collapsed: boolean;
};

const { Sider } = Layout;

const siderStyle: React.CSSProperties = {
  overflow: 'auto',
  height: '100vh',
  position: 'sticky',
  insetInlineStart: 0,
  top: 0,
  left: 0,
  bottom: 0,
  scrollbarWidth: 'thin',
  borderRight: '1px solid #F0F0F0',
};

export const AppSidebar = ({ collapsed }: AppSidebarProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Select menu items based on user role
  const menuItems =
    user?.role === ROLES.ADMIN ? adminMenuItems : managerMenuItems;

  const handleMenuClick = (key: string) => {
    // Map menu keys to routes
    const routeMap: Record<string, string> = {
      // Admin routes
      'system-overview': '/admin/dashboard',
      'store-list': '/admin/stores',
      'music-library': '/admin/music',
      // Manager routes
      overview: '/manager/dashboard',
      'auto-manual-mode': '/manager/music-control/mode',
      'playback-control': '/manager/music-control/playback',
      // Add more mappings...
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
      <Menu
        theme='light'
        mode='inline'
        className='border-none!'
        defaultSelectedKeys={['overview']}
        items={menuItems}
        onClick={({ key }) => handleMenuClick(key)}
      />
    </Sider>
  );
};
