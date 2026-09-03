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
  Megaphone,
  ScrollText,
  LifeBuoy,
  Home,
  CheckSquare,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Main",
    items: [{ label: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    title: "Organization",
    items: [
      { label: "Users", href: "/users", icon: Users, resource: "user" },
      { label: "Teams", href: "/teams", icon: UsersRound, resource: "team" },
      { label: "Departments", href: "/departments", icon: Building2, resource: "department" },
      { label: "Roles", href: "/roles", icon: Shield, resource: "role" },
      { label: "Announcements", href: "/announcements", icon: Megaphone },
      { label: "Policies", href: "/policies", icon: ScrollText },
    ],
  },
  {
    title: "Work & Time",
    items: [
      { label: "Projects", href: "/projects", icon: FolderKanban, resource: "project" },
      { label: "Leave", href: "/leave", icon: CalendarDays, resource: "leave" },
      { label: "Work From Home", href: "/wfh", icon: Home },
      { label: "WFH Approvals", href: "/wfh/approvals", icon: CheckSquare },
      { label: "Holidays", href: "/holidays", icon: CalendarOff, resource: "holiday" },
      { label: "Time Logs", href: "/time", icon: Clock, resource: "time" },
    ],
  },
  {
    title: "System & Admin",
    items: [
      { label: "Support", href: "/support", icon: LifeBuoy },
      { label: "Requests", href: "/requests", icon: ListChecks, resource: "request" },
    ],
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
            <p className="text-[10px] font-medium text-sidebar-foreground/40 truncate mt-0.5">
              Enterprise HR & Talent Suite
            </p>
          </div>
        </Link>
      </SidebarHeader>

      {/* Grouped Main Navigation */}
      <SidebarContent className="px-3 py-4 space-y-4">
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.title || "main"} className="p-0 space-y-1">
            {group.title && group.title !== "Main" && (
              <SidebarGroupLabel className="px-2 text-[10px] font-bold tracking-wider text-sidebar-foreground/50 uppercase mb-1">
                {group.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map((item) => (
                  <NavButton
                    key={item.href}
                    item={item}
                    active={pathname === item.href}
                    role={roleName}
                    isSpecialRole={user?.isSpecialRole}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer User Profile Card */}
      <SidebarFooter className="p-3 border-t border-sidebar-border/60">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="User account options"
              className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-sidebar-accent/80 transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer"
            >
              <Avatar className="h-9 w-9 border border-sidebar-border/60 shrink-0">
                {user?.avatarUrl && (
                  <AvatarImage
                    src={user.avatarUrl}
                    alt={displayName}
                    className="object-cover"
                  />
                )}
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
  isSpecialRole,
}: {
  item: NavItem;
  active: boolean;
  role?: string;
  isSpecialRole?: boolean;
}) {
  const isSuperadmin = (role || "").toUpperCase() === "SUPERADMIN";
  const hasSpecialAccess = isSuperadmin || !!isSpecialRole;

  // Time Logs not required in HR
  if (item.href === "/time") {
    const roleUpper = (role || "").toUpperCase();
    if (roleUpper === "HR" || roleUpper === "HR_ADMIN") {
      return null;
    }
  }

  // Requests module MUST be visible ONLY to SUPERADMIN
  if (item.href === "/requests" && !isSuperadmin) {
    return null;
  }

  // Roles module MUST be visible ONLY to Superadmin and Special Group (Founder, CEO, CTO, etc.)
  if (item.href === "/roles" && !hasSpecialAccess) {
    return null;
  }

  // WFH Approvals visible to TL, PM, HR, Superadmin, Special Group
  if (item.href === "/wfh/approvals") {
    const roleLower = (role || "").toLowerCase();
    const canApprove = hasSpecialAccess || ["hr", "manager", "lead", "superadmin"].includes(roleLower);
    if (!canApprove) return null;
  }

  const perms = usePermission(item.resource ?? "");
  const canRead =
    perms.read || perms.read_all || perms.read_own || perms.type_read;

  if (item.resource && !hasSpecialAccess && !canRead) {
    return null;
  }

  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        className={cn(
          "h-9 px-3 rounded-lg font-medium text-xs transition-all duration-150 flex items-center gap-3 cursor-pointer",
          active
            ? "bg-brand! text-white! font-bold shadow-2xs hover:bg-brand! hover:text-white! focus:bg-brand! focus:text-white! data-[active=true]:bg-brand! data-[active=true]:text-white!"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )}
      >
        <Link href={item.href}>
          <Icon
            className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              active ? "text-white" : "text-sidebar-foreground/70"
            )}
          />
          <span className="truncate">{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
