/**
 * Node modules
 */
import { Button, Layout } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UploadOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';

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
};

export const AppHeader = ({ collapsed, onClick }: AppHeaderProps) => {
  return (
    <Header style={headerStyle}>
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
    </Header>
  );
};
