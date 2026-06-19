import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { User, Settings, LogOut } from 'lucide-react';

export function UserFooter({ user, onLogout }) {
  const navigate = useNavigate();

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User';

  // Sub-label: "Role · X cities" matching mockup
  const role      = user?.role ?? '';
  const cityCount = (user?.city_count ?? user?.cities?.length) ?? null;
  const subLabel  = [
    role,
    cityCount != null ? `${cityCount} ${cityCount === 1 ? 'city' : 'cities'}` : null,
  ].filter(Boolean).join(' · ') || (user?.email ?? '');

  // Initials for avatar
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="cursor-pointer hover:bg-accent/80 transition-all duration-200 rounded-lg h-auto py-2"
            >
              {/* Solid green avatar */}
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={user?.avatar_url} alt={displayName} />
                <AvatarFallback className="bg-primary text-white text-[11px] font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Name + role · cities */}
              <div className="grid flex-1 text-left leading-tight min-w-0">
                <span className="truncate font-semibold text-foreground text-xs">
                  {displayName}
                </span>
                <span className="text-muted-foreground truncate text-[10px]">
                  {subLabel}
                </span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          {/* Dropdown */}
          <DropdownMenuContent side="right" align="end" className="w-52 shadow-md">
            <div className="px-2 py-1.5 border-b border-border mb-1">
              <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email ?? ''}</p>
            </div>

            <DropdownMenuItem
              className="cursor-pointer text-sm h-8"
              onClick={() => navigate('/profile')}
            >
              <User className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Profile</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer text-sm h-8"
              onClick={() => navigate('/settings/account')}
            >
              <Settings className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer text-sm h-8 text-red-600 focus:text-red-600 focus:bg-red-50"
              onClick={onLogout}
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}