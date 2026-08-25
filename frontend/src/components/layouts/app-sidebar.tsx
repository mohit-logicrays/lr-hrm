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
import Logo from "@/components/ui/Logo";
import { useAuth, usePermission } from "@/providers/auth-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  /** Show only when this model permission grants read */
  requiresPermission?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  {
    label: "User Management",
    href: "/users",
    icon: Users,
    requiresPermission: "user",
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <NavButton
                  key={item.href}
                  item={item}
                  active={pathname === item.href}
                  role={user?.role}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-4 py-3 text-xs text-text-tertiary">
          Signed in as{" "}
          <span className="font-medium text-text-secondary">{user?.role}</span>
        </div>
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
  // Superuser sees everything; others need read permission on the module model
  const canRead = usePermission(item.requiresPermission ?? "")?.read;

  if (item.requiresPermission && role !== "superuser" && !canRead) {
    return null;
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active}>
        <Link href={item.href}>
          <item.icon />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
