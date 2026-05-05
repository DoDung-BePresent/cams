/**
 * Node modules
 */
import { Flex } from 'antd';

/**
 * Components
 */
import { AuthBackground } from './AuthBackground';
import { AuthFooter } from './AuthFooter';
import { AuthHeader } from './AuthHeader';

export const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='relative min-h-dvh font-sans'>
      <Flex
        vertical
        className='min-h-screen'
      >
        <AuthHeader />
        <main className='w-full flex-1'>{children}</main>
        <AuthFooter />
      </Flex>
      <AuthBackground />
    </div>
  );
};
