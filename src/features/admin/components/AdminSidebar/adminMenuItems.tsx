import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  ShopOutlined,
  CustomerServiceOutlined,
  RobotOutlined,
  ApiOutlined,
  TeamOutlined,
  FileTextOutlined,
} from '@ant-design/icons';

type MenuItem = Required<MenuProps>['items'][number];

export const adminMenuItems: MenuItem[] = [
  {
    key: 'admin-dashboard',
    icon: <DashboardOutlined />,
    label: 'Admin Dashboard',
    children: [
      {
        key: 'system-overview',
        label: 'System Overview',
      },
    ],
  },
  {
    key: 'store-management',
    icon: <ShopOutlined />,
    label: 'Store Management',
    children: [
      {
        key: 'store-list',
        label: 'Store List',
      },
      {
        key: 'store-configuration',
        label: 'Store Configuration',
      },
      {
        key: 'device-iot-management',
        label: 'Device / IoT Management',
      },
    ],
  },
  {
    key: 'music-management',
    icon: <CustomerServiceOutlined />,
    label: 'Music Management',
    children: [
      {
        key: 'music-library',
        label: 'Music Library',
      },
      {
        key: 'playlist-templates',
        label: 'Playlist Templates',
      },
      {
        key: 'mood-genre-tags',
        label: 'Mood / Genre Tags',
      },
    ],
  },
  {
    key: 'ai-configuration',
    icon: <RobotOutlined />,
    label: 'AI Configuration',
    children: [
      {
        key: 'rule-settings',
        label: 'Rule Settings',
      },
      {
        key: 'external-ai-music-api',
        label: 'External AI Music API',
      },
    ],
  },
  {
    key: 'pos-integration',
    icon: <ApiOutlined />,
    label: 'POS Integration',
    children: [
      {
        key: 'data-mapping',
        label: 'Data Mapping',
      },
      {
        key: 'sync-status',
        label: 'Sync Status',
      },
    ],
  },
  {
    key: 'user-role-management',
    icon: <TeamOutlined />,
    label: 'User & Role Management',
    children: [
      {
        key: 'admin-users',
        label: 'Admin',
      },
      {
        key: 'store-managers',
        label: 'Store Manager',
      },
      {
        key: 'staff',
        label: 'Staff',
      },
    ],
  },
  {
    key: 'system-logs',
    icon: <FileTextOutlined />,
    label: 'System Logs',
    children: [
      {
        key: 'music-decision-logs',
        label: 'Music Decision Logs',
      },
      {
        key: 'api-call-logs',
        label: 'API Call Logs',
      },
      {
        key: 'error-logs',
        label: 'Error Logs',
      },
    ],
  },
];
