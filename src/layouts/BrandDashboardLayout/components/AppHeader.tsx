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
import { useFullscreen } from '@/shared/hooks/useFullScreen';

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
                <BellOutlined style={{ fontSize: 16 }} />
              </Badge>
            }
            style={{
              fontSize: '16px',
              width: 36,
              height: 36,
            }}
          />
          <Button
            type='text'
            icon={<MessageOutlined style={{ fontSize: 16 }} />}
            style={{
              fontSize: '16px',
              width: 36,
              height: 36,
            }}
          />
          <Button
            type='text'
            icon={
              isFullscreen ? (
                <FullscreenExitOutlined style={{ fontSize: 16 }} />
              ) : (
                <FullscreenOutlined style={{ fontSize: 16 }} />
              )
            }
            onClick={toggleFullscreen}
            style={{
              fontSize: '16px',
              width: 36,
              height: 36,
            }}
          />
          <Dropdown
            menu={{ items: userMenuItems }}
            placement='bottomRight'
            arrow
          >
            <Avatar
              size={36}
              src={avatarImage}
              icon={<UserOutlined />}
              style={{ cursor: 'pointer' }}
            />
          </Dropdown>
        </Flex>
      </Flex>
    </Header>
  );
};
