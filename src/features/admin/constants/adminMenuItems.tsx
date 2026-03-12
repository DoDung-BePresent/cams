import type { ItemType } from 'antd/es/menu/interface';
import {
  DashboardOutlined,
  UserOutlined,
  ShopOutlined,
  CustomerServiceOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';

export const adminMenuItems: ItemType[] = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  },
  {
    key: 'accounts',
    icon: <UserOutlined />,
    label: 'Account Management',
  },
  {
    key: 'brands',
    icon: <ShopOutlined />,
    label: 'Brand Management',
  },
  {
    key: 'tracks',
    icon: <CustomerServiceOutlined />,
    label: 'Track Library',
  },
  {
    key: 'playlists',
    icon: <UnorderedListOutlined />,
    label: 'Playlist Library',
  },
];
