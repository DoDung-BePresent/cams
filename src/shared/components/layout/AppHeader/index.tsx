/**
 * Node modules
 */
import { useState } from 'react';
import { Avatar, Badge, Button, Dropdown, Flex, Layout, Tag } from 'antd';

/**
 * Icons
 */
import {
  BellOutlined,
  DisconnectOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons';

/**
 * Hooks
 */
import { useAuth, useTheme } from '@/providers';
import { useFullscreen, useNetworkStatus } from '@/shared/hooks';

/**
 * Components
 */
import { UserDropdownContent } from './UserDropdownContent';

/**
 * Configs
 */
import { AVATAR_SIZE } from '@/config';
import { RoleEnum } from '@/shared/types';

type AppHeaderProps = {
  collapsed: boolean;
  onClick: () => void;
};

const { Header } = Layout;

const headerStyle: React.CSSProperties = {
  height: 60,
  display: 'flex',
  alignItems: 'center',
  paddingInline: 10,
  paddingInlineEnd: 20,
  position: 'sticky',
  top: 0,
  zIndex: 100,
  background: 'rgba(15,15,17,0.82)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  borderBottom: '1px solid rgba(80,45,50,0.7)',
};

export const AppHeader = ({ collapsed, onClick }: AppHeaderProps) => {
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { mode, toggleTheme } = useTheme();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Only show theme toggle for SystemAdmin
  const showThemeToggle = user?.roles[0] === RoleEnum.SystemAdmin;

  return (
    <Header style={headerStyle}>
      <Flex
        align='center'
        justify='space-between'
        className='w-full'
      >
        {/* Left */}
        <Flex
          gap='small'
          align='center'
        >
          <Button
            type='text'
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={onClick}
            // style={{ , width: 36, height: 36 }}
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

        {/* Right */}
        <Flex gap='small'>
          <Button
            type='text'
            icon={
              <Badge
                size='small'
                color='blue'
                count={5}
              >
                <BellOutlined />
              </Badge>
            }
            style={{ width: 36, height: 36 }}
          />
          {showThemeToggle && (
            <Button
              type='text'
              onClick={(e) => toggleTheme(e)}
              icon={mode === 'dark' ? <MoonOutlined /> : <SunOutlined />}
              style={{ width: 36, height: 36 }}
            />
          )}
          <Button
            type='text'
            onClick={toggleFullscreen}
            icon={
              isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />
            }
            style={{ width: 36, height: 36 }}
          />

          <Dropdown
            open={dropdownOpen}
            onOpenChange={(open, info) => {
              if (!open && info?.source === 'menu') return;
              setDropdownOpen(open);
            }}
            trigger={['click']}
            placement='bottomRight'
            popupRender={() => (
              <div
                className='overflow-hidden rounded-sm shadow-md'
                style={{
                  backgroundColor: 'var(--ant-color-bg-elevated)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <UserDropdownContent />
              </div>
            )}
          >
            <Avatar
              size={AVATAR_SIZE.small}
              src={user?.avatarUrl}
              icon={<UserOutlined />}
              style={{ cursor: 'pointer' }}
            />
          </Dropdown>
        </Flex>
      </Flex>
    </Header>
  );
};
