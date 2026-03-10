import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  ShopOutlined,
  TeamOutlined,
  ControlOutlined,
  ScheduleOutlined,
  BarChartOutlined,
  SettingOutlined,
  EnvironmentOutlined,
  MobileOutlined,
} from '@ant-design/icons';

type MenuItem = Required<MenuProps>['items'][number];

export const managerMenuItems: MenuItem[] = [
  {
    key: 'dashboard-group',
    label: 'Dashboard',
    type: 'group',
    children: [
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: 'Overview',
      },
    ],
  },
  {
    key: 'management-group',
    label: 'Management',
    type: 'group',
    children: [
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
        key: 'spaces',
        icon: <EnvironmentOutlined />,
        label: 'Space Management',
      },
      {
        key: 'devices',
        icon: <MobileOutlined />,
        label: 'Devices',
      },
    ],
  },
  {
    key: 'operations-group',
    label: 'Operations',
    type: 'group',
    children: [
      {
        key: 'music-control',
        icon: <ControlOutlined />,
        label: 'Music Control',
        children: [
          {
            key: 'auto-manual-mode',
            label: 'Auto/Manual Mode',
          },
          {
            key: 'playback-control',
            label: 'Playback Control',
          },
        ],
      },
      {
        key: 'schedule',
        icon: <ScheduleOutlined />,
        label: 'Schedule',
        children: [
          {
            key: 'time-based-rules',
            label: 'Time-based Rules',
          },
          {
            key: 'event-based-rules',
            label: 'Event-based Rules',
          },
        ],
      },
    ],
  },
  {
    key: 'reports-group',
    label: 'Reports',
    type: 'group',
    children: [
      {
        key: 'reports',
        icon: <BarChartOutlined />,
        label: 'Analytics',
        children: [
          {
            key: 'music-vs-sales',
            label: 'Music vs Sales',
          },
          {
            key: 'customer-engagement',
            label: 'Customer Engagement',
          },
          {
            key: 'playback-history',
            label: 'Playback History',
          },
        ],
      },
    ],
  },
  {
    key: 'settings-group',
    label: 'Settings',
    type: 'group',
    children: [
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: 'Settings',
      },
    ],
  },
];
