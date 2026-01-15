/**
 * Node modules
 */
import { Outlet } from 'react-router';

/**
 * Libs
 */
import { useAuth } from '@/lib/auth-provider';

export const MainLayout = () => {
  const { logout, user } = useAuth();

  return (
    <div className='flex min-h-screen'>
      {/* Sidebar Placeholder */}
      <aside className='bg-sidebar border-sidebar-border hidden w-64 border-r p-4 md:block'>
        <div className='mb-6 text-xl font-bold'>CAMS Store</div>
        <nav className='space-y-2'>
          <div className='hover:bg-sidebar-accent cursor-pointer rounded p-2'>
            Dashboard
          </div>
          <div className='hover:bg-sidebar-accent cursor-pointer rounded p-2'>
            Music Player
          </div>
        </nav>
      </aside>

      <div className='flex flex-1 flex-col'>
        {/* Header Placeholder */}
        <header className='border-border bg-background flex h-16 items-center justify-between border-b px-6'>
          <h2 className='font-semibold'>Welcome, {user?.fullName}</h2>
          <button
            onClick={logout}
            className='text-sm text-red-500 hover:underline'
          >
            Logout
          </button>
        </header>

        {/* Main Content */}
        <main className='bg-muted/20 flex-1 p-6'>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
