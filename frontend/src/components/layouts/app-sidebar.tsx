"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth, usePermission } from "@/providers/auth-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  CalendarDays,
  CalendarOff,
  Clock,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Shield,
  Users,
  UsersRound,
  Building2,
  Settings,
  MoreVertical,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Permission resource (from /me) the module is gated on. */
  resource?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  {
    label: "Users",
    href: "/users",
    icon: Users,
    resource: "user",
  },
  {
    label: "Teams",
    href: "/teams",
    icon: UsersRound,
    resource: "team",
  },
  {
    label: "Roles",
    href: "/roles",
    icon: Shield,
    resource: "role",
  },
  {
    label: "Departments",
    href: "/departments",
    icon: Building2,
    resource: "department",
  },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderKanban,
    resource: "project",
  },
  {
    label: "Leave",
    href: "/leave",
    icon: CalendarDays,
    resource: "leave",
  },
  {
    label: "Time",
    href: "/time",
    icon: Clock,
    resource: "time",
  },
  {
    label: "Holidays",
    href: "/holidays",
    icon: CalendarOff,
    resource: "holiday",
  },
  {
    label: "Requests",
    href: "/requests",
    icon: ListChecks,
    resource: "request",
  },
  {
    label: "Settings",
    href: "/profile",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const displayName = user?.name?.trim() || user?.email || "User";
  const roleName =
    typeof user?.role === "string" ? user.role : user?.role?.name || "Member";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <SidebarHeader className="p-4 border-b border-sidebar-border/40">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 p-1.5 shadow-sm group-hover:scale-105 transition-transform duration-200 border border-sidebar-border/50">
            <Image
              src="/lr_icon.png"
              alt="Logic Rays Logo"
              width={32}
              height={32}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-heading text-base font-bold text-sidebar-foreground tracking-tight leading-snug truncate">
              Logic Rays
            </span>
            <span className="text-[11px] font-medium text-sidebar-foreground/60 tracking-wider uppercase truncate">
              HRM Portal
            </span>
          </div>
        </Link>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent className="px-3 py-4">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-2 text-[11px] font-semibold tracking-wider text-sidebar-foreground/50 uppercase mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {NAV_ITEMS.map((item) => (
                <NavButton
                  key={item.href}
                  item={item}
                  active={pathname === item.href}
                  role={roleName}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer User Profile Card */}
      <SidebarFooter className="p-3 border-t border-sidebar-border/60">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="User account options"
              className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-sidebar-accent/80 transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Avatar className="h-9 w-9 border border-sidebar-border/60 shrink-0">
                <AvatarFallback className="bg-brand text-xs font-bold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate leading-snug">
                  {displayName}
                </p>
                <p className="text-xs font-normal text-sidebar-foreground/70 truncate capitalize">
                  {roleName}
                </p>
              </div>
              <MoreVertical className="h-4 w-4 text-sidebar-foreground/40 group-hover:text-sidebar-foreground transition-colors shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="top"
            className="w-56 rounded-xl p-1.5 shadow-xl"
          >
            <DropdownMenuLabel className="font-normal px-2 py-1.5">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-2 py-2">
              <Link href="/profile" className="flex items-center gap-2 text-sm font-medium">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span>My Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-2 py-2">
              <Link href="/profile" className="flex items-center gap-2 text-sm font-medium">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>Settings</span>
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
      </SidebarFooter>
    </Sidebar>
  );
}

function NavButton({
  item,
  active,
  role,
}: {
  item: NavItem;
  active: boolean;
  role?: string;
}) {
  const isSuperadmin = (role || "").toUpperCase() === "SUPERADMIN";

  // Requests module MUST be visible ONLY to SUPERADMIN
  if (item.href === "/requests" && !isSuperadmin) {
    return null;
  }

  const perms = usePermission(item.resource ?? "");
  const canRead =
    perms.read || perms.read_all || perms.read_own || perms.type_read;

  if (item.resource && !isSuperadmin && !canRead) {
    return null;
  }

  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        className={cn(
          "h-10 px-3.5 rounded-xl font-medium text-sm transition-all duration-200 active:scale-95 flex items-center gap-3",
          active
            ? "bg-brand text-white font-semibold shadow-sm hover:bg-brand/90 hover:text-white"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )}
      >
        <Link href={item.href}>
          <Icon
            className={cn(
              "h-4 w-4 shrink-0",
              active ? "text-white" : "text-sidebar-foreground/70"
            )}
          />
          <span className="truncate">{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

