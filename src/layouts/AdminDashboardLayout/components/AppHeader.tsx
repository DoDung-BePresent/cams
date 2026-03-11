/**
 * Node modules
 */
import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  Flex,
  Layout,
  Tag,
  Typography,
} from 'antd';
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
  UserOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';

/**
 * Constants
 */
import { ROLES } from '@/shared/constants/rolesConstants';

/**
 * Hooks
 */
import { useAuth } from '@/providers/AuthProvider';
import { useFullscreen } from '@/shared/hooks/useFullScreen';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';

/**
 * Types
 */
type AppHeaderProps = {
  collapsed: boolean;
  onClick: () => void;
};

const { Header } = Layout;
const { Text } = Typography;

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
  zIndex: 100,
};

export const AppHeader = ({ collapsed, onClick }: AppHeaderProps) => {
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isOnline } = useNetworkStatus();

  const isManager = user?.role === ROLES.SYSTEM_ADMIN;

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        navigate('/login', { replace: true });
      },
    });
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: (
        <Flex vertical>
          <Text strong>{`${user?.firstName} ${user?.lastName}`}</Text>
          <Text type='secondary'>{user?.email}</Text>
        </Flex>
      ),
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
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
        <Flex
          gap='small'
          align='center'
        >
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
          {!isOnline && (
            <Tag
              icon={<DisconnectOutlined />}
              color='error'
            >
              Offline Mode
            </Tag>
          )}
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
              src={user?.avatarUrl}
              icon={<UserOutlined />}
            />
          </Dropdown>
        </Flex>
      </Flex>
    </Header>
  );
};
