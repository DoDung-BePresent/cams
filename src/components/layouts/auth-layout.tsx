/**
 * Node modules
 */
import { Outlet } from 'react-router';

export const AuthLayout = () => {
  return (
    <div className='flex min-h-screen w-full items-center justify-center bg-gray-50 p-4 dark:bg-gray-900'>
      <div className='w-full max-w-md'>
        {/* Logo hoặc Branding CAMS ở đây */}
        <div className='mb-8 text-center'>
          <h1 className='bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent'>
            CAMS
          </h1>
          <p className='text-muted-foreground mt-2'>
            AI Music Streaming System
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};
