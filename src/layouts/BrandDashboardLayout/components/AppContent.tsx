/**
 * Node modules
 */
import { Layout } from 'antd';

const { Content } = Layout;

export const AppContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <Content
      className='p-4 transition-all duration-300 lg:p-6'
      style={{
        background:
          'radial-gradient(circle at 18% 0%, rgba(127,29,29,0.34) 0%, rgba(127,29,29,0.08) 26%, transparent 48%), linear-gradient(135deg, #111113 0%, #161112 44%, #09090b 100%)',
      }}
    >
      <div
        className='min-h-full w-full rounded-[2rem] p-6 transition-all duration-500 lg:p-8'
        style={{
          background: 'rgba(24,24,27,0.78)',
          border: '1px solid rgba(80,45,50,0.7)',
          boxShadow: '0 18px 48px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(18px)',
        }}
      >
        {children}
      </div>
    </Content>
  );
};
