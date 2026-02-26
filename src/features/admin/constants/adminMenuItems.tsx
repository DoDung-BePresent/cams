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
    key: 'dashboard-group',
    label: 'Dashboard',
    type: 'group',
    children: [
      {
        key: 'admin-dashboard',
        icon: <DashboardOutlined />,
        label: 'System Overview',
      },
    ],
  },
  {
    key: 'management-group',
    label: 'Management',
    type: 'group',
    children: [
      {
        key: 'brand-management', 
        icon: <ShopOutlined />,
        label: 'Brand Management',
      },
      {
        key: 'user-management',
        icon: <TeamOutlined />,
        label: 'User Management',
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
    ],
  },
  {
    key: 'integration-group',
    label: 'Integration & Configuration',
    type: 'group',
    children: [
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
    ],
  },
  {
    key: 'monitoring-group',
    label: 'Monitoring',
    type: 'group',
    children: [
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
    ],
  },
];
