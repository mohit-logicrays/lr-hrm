"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Briefcase, Activity, AlertTriangle } from "lucide-react";
import { ClipboardList } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { api, type Project } from "@/lib/api";

import {
  WelcomeBanner,
  StatCard,
  DepartmentHealthWidget,
  CriticalAlertsWidget,
  ProjectStatusGridWidget,
  AnnouncementsWidget,
} from "./widgets";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function SuperadminDashboard() {
  const { user } = useAuth();
  const firstName = user?.firstName || user?.name?.split(" ")[0] || "there";

  const [totalEmployees, setTotalEmployees] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [projectsLoading, setProjectsLoading] = useState(true);

  useEffect(() => {
    api.listUsers(1, 1, "").then((res) => setTotalEmployees(res.pagination?.total || 0)).catch(() => {});

    api
      .listProjects(1, 50)
      .then((res) => setProjects(res.data || []))
      .catch(() => {})
      .finally(() => setProjectsLoading(false));

    api
      .listLeaveRequests(1, 1, { status: "PENDING" })
      .then((res) => setPendingLeaveCount(res.pagination?.total || res.data?.length || 0))
      .catch(() => {});
  }, []);

  const activeCount = projects.filter((p) => p.status === "ACTIVE").length;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-6 md:p-8 space-y-7 max-w-7xl mx-auto"
    >
      {/* Welcome */}
      <WelcomeBanner firstName={firstName} variant="admin" variants={item} />

      {/* KPI Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard variants={item} icon={Users} label="Total Employees" value={totalEmployees || "—"} sub="Active members" color="text-brand" bg="bg-brand/10" />
        <StatCard variants={item} icon={Briefcase} label="Active Projects" value={activeCount} sub="In progress" color="text-info" bg="bg-info/10" />
        <StatCard variants={item} icon={Activity} label="Attendance Rate" value="—" sub="Today" trend="vs yesterday" trendUp color="text-success" bg="bg-success/10" />
        <StatCard variants={item} icon={AlertTriangle} label="Pending Approvals" value={pendingLeaveCount} sub="Require attention" color="text-error" bg="bg-error/10" />
      </div>

      {/* Department chart + alerts + announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DepartmentHealthWidget limit={7} variants={item} />
        </div>
        <div className="flex flex-col gap-4">
          <CriticalAlertsWidget
            variants={item}
            alerts={[
              {
                id: "pending-leaves",
                icon: ClipboardList,
                title: `${pendingLeaveCount} Leave Requests`,
                description: "Awaiting HR approval",
                count: pendingLeaveCount,
              },
            ]}
          />
          <AnnouncementsWidget limit={3} variants={item} />
        </div>
      </div>

      {/* Project status grid */}
      <ProjectStatusGridWidget
        projects={projects}
        loading={projectsLoading}
        variants={item}
      />
    </motion.div>
  );
}
