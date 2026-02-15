import React from 'react';
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getModules } from '@/api/modules.api';
import { getMenusByModule } from '@/api/menus.api';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuAction
} from '@/components/ui/sidebar';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

import { 
  Home, 
  Settings, 
  Users, 
  FileText, 
  BarChart, 
  Package, 
  HelpCircle,
  ChevronDown,
  User,
  LogOut,
  ChevronsUpDown
} from 'lucide-react';

export const menuItems = [
    {
      title: 'Dashboard',
      icon: Home,
      url: '#',
    },
    {
      title: 'Products',
      icon: Package,
      items: [
        { title: 'All Products', url: '#' },
        { title: 'Add New', url: '#' },
        { title: 'Categories', url: '#' },
      ],
    },
    {
      title: 'Users',
      icon: Users,
      items: [
        { title: 'All Users', url: '#' },
        { title: 'Add User', url: '#' },
        { title: 'Roles', url: '#' },
      ],
    },
    {
      title: 'Reports',
      icon: BarChart,
      items: [
        { title: 'Sales', url: '#' },
        { title: 'Analytics', url: '#' },
        { title: 'Export', url: '#' },
      ],
    },
    {
      title: 'Documents',
      icon: FileText,
      url: '#',
    },
    {
      title: 'Settings',
      icon: Settings,
      items: [
        { title: 'General', url: '#' },
        { title: 'Security', url: '#' },
        { title: 'Notifications', url: '#' },
      ],
    },
    {
      title: 'Help',
      icon: HelpCircle,
      url: '#',
    },
  ];

export function AppSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    
    navigate("/login");
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="w-4/5 mx-auto">
          <img 
            src="../../../public/abhimata.png"
            className="w-full object-contain"
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <Collapsible defaultOpen={false} className="group/collapsible">
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <item.icon />
                          <span>{item.title}</span>
                          <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:-rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <a href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <div className="flex items-center gap-2 px-1 py-1.5">
                    <Avatar>
                      <AvatarImage
                        src="https://github.com/shadcn.png"
                        alt="profile"
                        className="grayscale"
                      />
                    </Avatar>
                  
                    <div className="grid flex-1 text-left text-sm">
                      <span className="truncate font-medium">Zacvin</span>  
                      <span className="text-muted-foreground truncate text-xs">
                        zac@gmail.com
                      </span>
                    </div>
                  </div>
                  <ChevronsUpDown className="ml-auto h-4 w-4" />

                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                side="right" 
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    handleLogout();
                    console.log('Logging out...');
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}