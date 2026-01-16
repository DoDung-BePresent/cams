/**
 * Node modules
 */
import { Outlet } from 'react-router';

/**
 * Components
 */
import { Header } from '@/components/common/header';

export const AuthLayout = () => {
  // FIXME: hardcode color values
  return (
    <div className='min-h-dvh bg-[#FEFAE9]'>
      <div className='pt-5'>
        <Header />
      </div>
      <div className='flex items-center justify-center'>
        <Outlet />
      </div>
    </div>
  );
};
