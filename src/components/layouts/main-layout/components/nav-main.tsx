/**
 * Components
 */
import {
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { LayoutDashboardIcon } from 'lucide-react';
import { NavLink, useLocation } from 'react-router';

export const NavMain = () => {
  const { pathname } = useLocation();

  const isDashboardActive = pathname === '/stores';
  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isDashboardActive}
            >
              <NavLink
                to='/stores'
                // Dùng string class bình thường thay vì function
                className={
                  isDashboardActive ? '[&>svg]:bg-primary text-black' : ''
                }
              >
                <LayoutDashboardIcon />
                Dashboard
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  );
};
