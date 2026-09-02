"use client";

import { useAuth } from "@/providers/auth-provider";
import { MemberDashboard } from "@/components/dashboard/MemberDashboard";
import { TeamLeadDashboard } from "@/components/dashboard/TeamLeadDashboard";
import { PMDashboard } from "@/components/dashboard/PMDashboard";
import { HRDashboard } from "@/components/dashboard/HRDashboard";
import { SuperadminDashboard } from "@/components/dashboard/SuperadminDashboard";

function getRoleName(user: ReturnType<typeof useAuth>["user"]): string {
  if (!user) return "";
  const raw = typeof user.role === "string" ? user.role : user.role?.name || "";
  return raw.toUpperCase();
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const role = getRoleName(user);

  if (loading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-8 w-48 bg-surface-subtle rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-surface-subtle rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-surface-subtle rounded-2xl animate-pulse" />
          <div className="h-64 bg-surface-subtle rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (role === "SUPERADMIN") return <SuperadminDashboard />;
  if (role === "HR_ADMIN" || role === "HR") return <HRDashboard />;
  if (role === "PROJECT_MANAGER" || role === "PM") return <PMDashboard />;
  if (role === "TEAM_LEAD" || role === "TL" || role === "TEAMLEAD") return <TeamLeadDashboard />;

  // Default: Member / Associate / any other role
  return <MemberDashboard />;
}
