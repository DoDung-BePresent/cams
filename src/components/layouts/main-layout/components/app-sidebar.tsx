/**
 * Node modules
 */
import { useState } from 'react';
import { PinIcon, PinOffIcon } from 'lucide-react';

/**
 * Components
 */
import { NavUser } from './nav-user';
import { NavMain } from './nav-main';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';

/**
 * Libs
 */
import { cn } from '@/lib/utils';

export const AppSidebar = () => {
  const { open, setOpen } = useSidebar();
  const [isHoverOpen, setIsHoverOpen] = useState(false);

  // Handle interaction: Hovering over the sidebar
  const handleMouseEnter = () => {
    // Only expand if currently closed and not already operating in hover mode
    if (!open) {
      setIsHoverOpen(true);
      setOpen(true);
    }
  };

  const handleMouseLeave = () => {
    // If we opened it via hover, close it when leaving
    if (isHoverOpen) {
      setOpen(false);
      setIsHoverOpen(false);
    }
  };

  // Handle interaction: Clicking the Pin/Unpin button
  const handlePinClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isHoverOpen) {
      // If currently open due to hover, clicking pin should "lock" it open.
      // We do this by clearing the hover state (so mouseLeave won't close it).
      setIsHoverOpen(false);
    } else {
      // Standard toggle behavior
      setOpen(!open);
    }
  };

  return (
    <Sidebar
      collapsible='icon'
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <SidebarHeader>
        <SidebarMenu className='flex flex-row! items-center justify-between p-3'>
          <Logo
            className='size-10 shrink-0'
            showLabel={open}
          />
          {/* Show Pin button if open (either pinned or hovering) */}
          {open && (
            <Button
              onClick={handlePinClick}
              data-sidebar='trigger'
              variant='ghost'
              size='icon'
              className={cn(
                'size-7',
                !isHoverOpen && 'bg-primary/10 text-primary [&>svg]:stroke-2',
              )}
            >
              {isHoverOpen ? (
                // If hovering, show "Pin" icon (click to pin)
                <PinIcon className='size-3.5! rotate-45' />
              ) : (
                // If pinned, show "Unpin" icon (click to collapse)
                <PinOffIcon className='size-3.5!' />
              )}
              <span className='sr-only'>Toggle Sidebar</span>
            </Button>
          )}
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
};
