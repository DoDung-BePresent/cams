import { Layout } from 'antd';

import { StickyPlayer } from '@/shared/components/common/StickyPlayer';

const { Content } = Layout;

export const AppContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <Content
      style={{
        background:
          'radial-gradient(circle at 18% 0%, rgba(127,29,29,0.34) 0%, rgba(127,29,29,0.08) 26%, transparent 48%), linear-gradient(135deg, #111113 0%, #161112 44%, #09090b 100%)',
        minHeight: '100vh',
        paddingBottom: 90, // Space for sticky player
      }}
    >
      <div style={{ height: '100%' }}>{children}</div>
      <StickyPlayer />
    </Content>
  );
};
