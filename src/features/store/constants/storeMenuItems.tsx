import {
  DashboardOutlined,
  EnvironmentOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

type MenuItem = Required<MenuProps>['items'][number];

/**
 * Store Manager Menu Items
 * Simplified menu compared to BrandManager
 */
export const STORE_MENU_ITEMS: MenuItem[] = [
  {
    key: '/store/dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  },
  {
    key: '/store/spaces',
    icon: <EnvironmentOutlined />,
    label: 'Space Management',
  },
  {
    key: '/store/settings',
    icon: <SettingOutlined />,
    label: 'Settings',
  },
];
