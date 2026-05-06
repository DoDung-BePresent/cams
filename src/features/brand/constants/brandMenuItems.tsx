import type { ItemType } from 'antd/es/menu/interface';

/**
 * Icons
 */
import {
  DashboardOutlined,
  ShopOutlined,
  TeamOutlined,
  CustomerServiceOutlined,
  UnorderedListOutlined,
  CalendarOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  WalletOutlined,
} from '@ant-design/icons';

export const BRAND_MENU_ITEMS: ItemType[] = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  },
  {
    key: 'playlists',
    icon: <UnorderedListOutlined />,
    label: 'Playlists',
  },
  {
    key: 'tracks',
    icon: <CustomerServiceOutlined />,
    label: 'Tracks',
  },
  {
    key: 'schedule',
    icon: <CalendarOutlined />,
    label: 'Schedule',
  },
  {
    key: 'stores',
    icon: <ShopOutlined />,
    label: 'Stores',
  },
  {
    key: 'staff',
    icon: <TeamOutlined />,
    label: 'Staffs',
  },
  {
    key: 'config-management',
    icon: <SettingOutlined />,
    label: 'Config',
  },
  {
    key: 'suno-ai',
    icon: <ThunderboltOutlined />,
    label: 'AI Music Generator',
  },
  {
    key: 'tokens',
    icon: <WalletOutlined />,
    label: 'Tokens & top-up',
  },
];
