import { Layout } from 'antd';

import { StickyPlayer } from '@/shared/components/common/StickyPlayer';

const { Content } = Layout;

export const AppContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <Content
      style={{
        background: '#121212',
        minHeight: '100vh',
        paddingBottom: 90, // Space for sticky player
      }}
    >
      <div style={{ height: '100%' }}>{children}</div>
      <StickyPlayer />
    </Content>
  );
};
