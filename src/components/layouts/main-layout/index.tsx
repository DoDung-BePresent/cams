/**
 * Node modules
 */
import { Outlet } from 'react-router';

/**
 * Components
 */
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './components/app-sidebar';

export const MainLayout = () => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main>
        <Outlet />
      </main>
    </SidebarProvider>
  );
};
