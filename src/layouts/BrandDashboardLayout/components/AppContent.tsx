/**
 * Node modules
 */
import { Layout } from 'antd';

const { Content } = Layout;

export const AppContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <Content className='bg-slate-50/50 p-4 transition-all duration-300 lg:p-6'>
      <div className='min-h-full w-full rounded-[2rem] border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur-xl transition-all duration-500 hover:bg-white hover:shadow-md lg:p-8'>
        {children}
      </div>
    </Content>
  );
};
