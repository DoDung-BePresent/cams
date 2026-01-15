/**
 * Node modules
 */
import { Outlet } from 'react-router';

export const AuthLayout = () => {
  // FIXME: hardcode color values
  return (
    <div className='flex min-h-dvh items-center justify-center bg-[#FEFAE9]'>
      <Outlet />
    </div>
  );
};
