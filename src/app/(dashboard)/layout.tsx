'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart2,
  FileText,
  Handshake,
  Home,
  LogOut,
  Settings,
  Users,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'داشبورد', icon: Home },
  { href: '/agents', label: 'نمایندگان', icon: Users },
  { href: '/invoices', label: 'فاکتورها', icon: FileText },
  { href: '/partners', label: 'همکاران فروش', icon: Handshake },
  { href: '/reports', label: 'گزارشات', icon: BarChart2 },
  { href: '/settings', label: 'تنظیمات', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar side="right" collapsible="icon" className="border-l bg-card">
          <SidebarHeader className="p-4">
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-2">
            <UserMenu />
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-card px-4 sm:px-6 md:justify-end">
            <SidebarTrigger className="md:hidden" />
            <UserMenu />
          </header>
          <main className="flex-1 overflow-y-auto bg-background">
            <div className="p-4 pt-6 sm:p-6 md:p-8">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-full justify-start gap-2 px-2 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://picsum.photos/seed/user-avatar/100/100" alt="User" data-ai-hint="person portrait" />
            <AvatarFallback>ادمین</AvatarFallback>
          </Avatar>
          <div className="truncate text-right group-data-[collapsible=icon]:hidden">
            <p className="font-semibold">ادمین سیستم</p>
            <p className="text-xs text-muted-foreground">admin@marfanet.com</p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">ادمین سیستم</p>
            <p className="text-xs leading-none text-muted-foreground">
              admin@marfanet.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut className="ml-2 h-4 w-4" />
          <span>خروج از حساب</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
