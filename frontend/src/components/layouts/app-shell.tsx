"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Search,
  LogOut,
  User as UserIcon,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { NotificationBellDropdown } from "@/components/notifications/NotificationBellDropdown";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/users": "Users",
  "/roles": "Roles & Permissions",
  "/departments": "Departments",
  "/teams": "Teams",
  "/projects": "Projects",
  "/leave": "Leave Management",
  "/wfh": "Work From Home",
  "/wfh/approvals": "WFH Approvals",
  "/time": "Time & Attendance",
  "/holidays": "Holidays",
  "/requests": "Requests",
  "/profile": "Settings & Profile",
  "/notifications": "Notification Center",
  "/notifications/preferences": "Notification Preferences",
};

/**
 * Protected app shell with responsive top navigation bar & sidebar layout.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-9 w-9 animate-spin rounded-full border-3 border-border-base border-t-brand" />
      </div>
    );
  }

  const displayName = user.name?.trim() || user.email;
  const roleName =
    typeof user.role === "string" ? user.role : user.role?.name || "Member";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const currentPageTitle = PAGE_TITLES[pathname] || "HRM Portal";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen bg-bg">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border-base bg-surface/85 backdrop-blur-md px-4 lg:px-8 shadow-xs">
          {/* Left section: Sidebar trigger, separator, active page title */}
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-9 w-9 rounded-lg hover:bg-surface-subtle transition-colors text-text-secondary hover:text-text-primary" />
            <Separator orientation="vertical" className="!h-5 bg-border-base" />
            <h1 className="font-heading text-lg font-bold text-text-primary tracking-tight hidden sm:block">
              {currentPageTitle}
            </h1>
          </div>

          {/* Center section: Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 relative items-center">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across portal..."
              className="w-full h-10 pl-10 pr-4 bg-surface-subtle border-border-base rounded-full text-sm text-text-primary placeholder:text-text-tertiary focus-visible:ring-2 focus-visible:ring-brand/20 focus-visible:border-brand transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Right section: Actions & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden p-2 rounded-full hover:bg-surface-subtle text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Toggle Search"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Real-time Notification Bell & Drawer */}
            <NotificationBellDropdown />

            {/* Theme Toggle (Dark / Light) */}
            <ThemeToggle />

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="User menu"
                  className="rounded-full p-0.5 border border-border-base hover:border-brand transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <Avatar className="h-8 w-8">
                    {user?.avatarUrl && (
                      <AvatarImage
                        src={user.avatarUrl}
                        alt={displayName}
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="bg-brand/10 text-xs font-bold text-brand">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5 shadow-xl border-border-base">
                <DropdownMenuLabel className="font-normal px-2 py-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none text-text-primary">{displayName}</p>
                    <p className="text-xs text-text-tertiary truncate">{user.email}</p>
                    <p className="text-[11px] font-medium text-brand capitalize mt-1">{roleName}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-2 py-2">
                  <Link href="/profile" className="flex items-center gap-2 text-sm font-medium">
                    <UserIcon className="h-4 w-4 text-text-tertiary" />
                    <span>My Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  className="cursor-pointer rounded-lg px-2 py-2 text-destructive focus:bg-destructive/10 focus:text-destructive text-sm font-medium"
                  onClick={() => logout()}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile Search Expanded Bar */}
        {mobileSearchOpen && (
          <div className="md:hidden px-4 py-2 border-b border-border-base bg-surface">
            <div className="relative flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search portal..."
                className="w-full h-9 pl-9 pr-4 bg-surface-subtle text-sm rounded-lg"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

