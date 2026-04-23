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
    key: 'stores',
    icon: <ShopOutlined />,
    label: 'Store Management',
  },
  {
    key: 'staff',
    icon: <TeamOutlined />,
    label: 'Staff Management',
  },
  {
    key: 'tracks',
    icon: <CustomerServiceOutlined />,
    label: 'Track Management',
  },
  {
    key: 'playlists',
    icon: <UnorderedListOutlined />,
    label: 'Playlist Management',
  },
  {
    key: 'config-management',
    icon: <SettingOutlined />,
    label: 'Config Management',
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
  {
    key: 'schedule',
    icon: <CalendarOutlined />,
    label: 'Schedule',
  },
];
