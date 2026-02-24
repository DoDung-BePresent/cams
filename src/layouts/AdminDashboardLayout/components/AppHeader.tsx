/**
 * Node modules
 */
import { Avatar, Badge, Button, Dropdown, Flex, Layout } from 'antd';
import { useNavigate } from 'react-router';

/**
 * Icons
 */
import {
  BellOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';

/**
 * Assets
 */
import avatarImage from '@/assets/images/avatar-1.png';

/**
 * Providers
 */
import { useAuth } from '@/providers/AuthProvider';

/**
 * Shared
 */
import { ROLES } from '@/shared/constants/rolesConstants';
import { useFullscreen } from '@/shared/hooks/useFullScreen';

/**
 * Features
 */
import { BranchSwitcher } from '@/features/manager/components/BranchSwitcher';

/**
 * Types
 */
type AppHeaderProps = {
  collapsed: boolean;
  onClick: () => void;
};

const { Header } = Layout;

const headerStyle: React.CSSProperties = {
  background: 'white',
  height: 60,
  borderBottom: '1px solid #F0F0F0',
  display: 'flex',
  alignItems: 'center',
  paddingInline: 10,
  paddingInlineEnd: 20,
  position: 'sticky',
  top: 0,
  zIndex: 1,
};

export const AppHeader = ({ collapsed, onClick }: AppHeaderProps) => {
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isManager = user?.role === ROLES.SYSTEM_ADMIN;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  return (
    <Header style={headerStyle}>
      <Flex
        align='center'
        justify='space-between'
        className='w-full'
      >
        <Flex gap='small'>
          <Button
            type='text'
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={onClick}
            style={{
              fontSize: '16px',
              width: 36,
              height: 36,
            }}
          />
          {isManager && <BranchSwitcher />}
        </Flex>
        <Flex gap='small'>
          <Button
            type='text'
            icon={
              <Badge
                size='small'
                color='blue'
                count={5}
              >
                <BellOutlined style={{ fontSize: '16px' }} />
              </Badge>
            }
            style={{
              width: 36,
              height: 36,
            }}
          />
          <Button
            type='text'
            icon={<MessageOutlined style={{ fontSize: '16px' }} />}
            style={{
              width: 36,
              height: 36,
            }}
          />
          <Button
            type='text'
            onClick={toggleFullscreen}
            icon={
              isFullscreen ? (
                <FullscreenExitOutlined style={{ fontSize: '16px' }} />
              ) : (
                <FullscreenOutlined style={{ fontSize: '16px' }} />
              )
            }
            style={{
              width: 36,
              height: 36,
            }}
          />
          <Dropdown
            menu={{ items: userMenuItems }}
            placement='bottomRight'
          >
            <Avatar
              src={avatarImage}
              style={{ cursor: 'pointer' }}
            />
          </Dropdown>
        </Flex>
      </Flex>
    </Header>
  );
};
