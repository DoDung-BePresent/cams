import { Layout } from 'antd';

const { Content } = Layout;

export const AppContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <Content
      style={{
        background: '#121212',
        minHeight: '100vh',
      }}
    >
      <div style={{ height: '100%' }}>{children}</div>
    </Content>
  );
};
