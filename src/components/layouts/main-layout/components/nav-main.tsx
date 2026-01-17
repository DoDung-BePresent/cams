/**
 * Node modules
 */
import { AudioWaveformIcon, LayoutDashboardIcon } from 'lucide-react';

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
import { NavLink, useLocation } from 'react-router';

/**
 * Types
 */
import type { LucideIcon } from 'lucide-react';
type INavMain = {
  title: string;
  to: string;
  isActive: boolean;
  icon: LucideIcon;
};

export const NavMain = () => {
  const { pathname } = useLocation();

  const navMain: INavMain[] = [
    {
      title: 'Stores',
      to: '/stores',
      isActive: pathname === '/stores',
      icon: LayoutDashboardIcon,
    },
    {
      title: 'Playlist',
      to: '/playlist',
      isActive: pathname === '/playlist',
      icon: AudioWaveformIcon,
    },
  ];

  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarMenu>
          {navMain.map(({ title, to, isActive, icon: Icon }) => (
            <SidebarMenuItem>
              <SidebarMenuButton
                key={to}
                asChild
                isActive={isActive}
                className='text-muted-foreground'
              >
                <NavLink
                  to={to}
                  className={isActive ? '[&>svg]:bg-primary text-black' : ''}
                >
                  <Icon />
                  {title}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  );
};
