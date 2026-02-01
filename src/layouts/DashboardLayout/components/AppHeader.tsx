/**
 * Node modules
 */
import { Avatar, Badge, Button, Flex, Layout } from 'antd';
import {
  BellOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
  SettingOutlined,
} from '@ant-design/icons';

/**
 * Assets
 */
import avatarImage from '@/assets/images/avatar-1.png';

/**
 * Hooks
 */
import { useFullscreen } from '@/shared/hooks/useFullscreen';

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
};

export const AppHeader = ({ collapsed, onClick }: AppHeaderProps) => {
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  return (
    <Header style={headerStyle}>
      <Flex
        align='center'
        justify='space-between'
        className='w-full'
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
          <Button
            type='text'
            icon={
              <SettingOutlined
                spin
                style={{ fontSize: '16px' }}
              />
            }
            style={{
              width: 36,
              height: 36,
            }}
          />
          <Avatar src={avatarImage} />
        </Flex>
      </Flex>
    </Header>
  );
};
