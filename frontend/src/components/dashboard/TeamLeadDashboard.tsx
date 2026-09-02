"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Clock, AlertTriangle, ClipboardList } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { api, type TimeLog } from "@/lib/api";

import {
  WelcomeBanner,
  StatCard,
  SmartTimeTrackerWidget,
  PendingLeavesWidget,
  TeamQuickStatsWidget,
} from "./widgets";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function TeamLeadDashboard() {
  const { user } = useAuth();
  const firstName = user?.firstName || user?.name?.split(" ")[0] || "there";
  const [pendingCount, setPendingCount] = useState(0);
  const [todayHours, setTodayHours] = useState(0);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    api
      .listLeaveRequests(1, 1, { status: "PENDING" })
      .then((res) => setPendingCount(res.pagination?.total || res.data?.length || 0))
      .catch(() => {});

    api
      .listTimeLogs(1, 100, { from: today, to: today })
      .then((res) => {
        const logs: TimeLog[] = res.data || [];
        setTodayHours(logs.reduce((s, l) => s + (l.hours || 0), 0));
      })
      .catch(() => {});
  }, [today]);

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
        <StatCard variants={item} icon={Users} label="Team Present" value="—" sub="Today" color="text-success" bg="bg-success/10" />
        <StatCard variants={item} icon={ClipboardList} label="Pending Approvals" value={pendingCount} sub="Leave requests" color="text-brand" bg="bg-brand/10" />
        <StatCard variants={item} icon={Clock} label="Team Hours Logged" value={`${todayHours.toFixed(1)}h`} sub="Today" color="text-info" bg="bg-info/10" />
        <StatCard variants={item} icon={AlertTriangle} label="Blocked Tasks" value="—" sub="Needs attention" color="text-warning" bg="bg-warning/10" />
      </div>

      {/* Smart Time Tracker */}
      <SmartTimeTrackerWidget variants={item} />

      {/* Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending approvals — no inline actions for TL (TL doesn't do final approve) */}
        <PendingLeavesWidget
          approvalRole="TL"
          showActions={false}
          limit={6}
          variants={item}
        />

        {/* Quick team stats */}
        <TeamQuickStatsWidget
          variants={item}
          stats={[
            { label: "Team Members", value: "—", color: "text-text-primary" },
            { label: "Hours Logged This Week", value: "—", color: "text-success" },
            { label: "Tasks In Progress", value: "—", color: "text-info" },
            { label: "Tasks Completed This Week", value: "—", color: "text-brand" },
          ]}
        />
      </div>
    </motion.div>
  );
}
