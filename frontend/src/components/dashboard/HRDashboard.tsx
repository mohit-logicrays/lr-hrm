"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, CalendarOff, ClipboardList, UserPlus } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";

import {
  WelcomeBanner,
  StatCard,
  PendingLeavesWidget,
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

export function HRDashboard() {
  const { user } = useAuth();
  const firstName = user?.firstName || user?.name?.split(" ")[0] || "there";
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    api
      .listUsers(1, 1, "")
      .then((res) => setTotalEmployees(res.pagination?.total || 0))
      .catch(() => {});

    api
      .listLeaveRequests(1, 1, { status: "PENDING" })
      .then((res) => setPendingCount(res.pagination?.total || res.data?.length || 0))
      .catch(() => {});
  }, []);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-6 md:p-8 space-y-7 max-w-7xl mx-auto"
    >
      {/* Welcome */}
      <WelcomeBanner firstName={firstName} variants={item} />

      {/* KPI Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard variants={item} icon={Users} label="Total Employees" value={totalEmployees || "—"} sub="Active staff" color="text-brand" bg="bg-brand/10" />
        <StatCard variants={item} icon={CalendarOff} label="On Leave" value="—" sub="Today" color="text-warning" bg="bg-warning/10" />
        <StatCard variants={item} icon={ClipboardList} label="Pending Leaves" value={pendingCount} sub="Awaiting action" color="text-error" bg="bg-error/10" />
        <StatCard variants={item} icon={UserPlus} label="New Joiners" value="—" sub="This month" color="text-success" bg="bg-success/10" />
      </div>

      {/* Main Row — Pending leaves (with approve/reject) + Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PendingLeavesWidget
            approvalRole="HR"
            showActions={true}
            limit={8}
            variants={item}
          />
        </div>
        <AnnouncementsWidget limit={3} variants={item} />
      </div>
    </motion.div>
  );
}
