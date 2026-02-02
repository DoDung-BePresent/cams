import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  ControlOutlined,
  ScheduleOutlined,
  BarChartOutlined,
  SettingOutlined,
} from '@ant-design/icons';

type MenuItem = Required<MenuProps>['items'][number];

export const managerMenuItems: MenuItem[] = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
    children: [
      {
        key: 'overview',
        label: 'Overview',
      },
    ],
  },
  {
    key: 'music-control',
    icon: <ControlOutlined />,
    label: 'Music Control',
    children: [
      {
        key: 'auto-manual-mode',
        label: 'Auto / Manual Mode',
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
  {
    key: 'reports',
    icon: <BarChartOutlined />,
    label: 'Reports',
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
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: 'Settings',
    children: [
      {
        key: 'store-preferences',
        label: 'Store Preferences',
      },
    ],
  },
];
