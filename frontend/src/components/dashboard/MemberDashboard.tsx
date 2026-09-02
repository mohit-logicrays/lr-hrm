"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, CalendarDays, CheckSquare, Activity } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { api, type TimeLog } from "@/lib/api";

import {
  WelcomeBanner,
  StatCard,
  SmartTimeTrackerWidget,
  LeaveBalanceWidget,
  AnnouncementsWidget,
  TodayOverviewWidget,
} from "./widgets";

// ─── Animation Tokens ────────────────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// ─── Component ───────────────────────────────────────────────────────────────
export function MemberDashboard() {
  const { user } = useAuth();
  const firstName = user?.firstName || user?.name?.split(" ")[0] || "there";

  const [todayHours, setTodayHours] = useState(0);
  const [totalLeave, setTotalLeave] = useState(0);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    // Hours today
    api
      .listTimeLogs(1, 100, { from: today, to: today })
      .then((res) => {
        const logs: TimeLog[] = res.data || [];
        setTodayHours(logs.reduce((s, l) => s + (l.hours || 0), 0));
      })
      .catch(() => {});

    // Leave total remaining
    api
      .getLeaveBalance()
      .then((res) => {
        const balances = res.data?.balances || [];
        setTotalLeave(balances.reduce((s, b) => s + (b.allocated - b.used), 0));
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
        <StatCard variants={item} icon={Clock} label="Hours Today" value={`${todayHours.toFixed(1)}h`} sub="Logged today" color="text-brand" bg="bg-brand/10" />
        <StatCard variants={item} icon={CalendarDays} label="Leave Balance" value={totalLeave} sub="Days remaining" color="text-info" bg="bg-info/10" />
        <StatCard variants={item} icon={CheckSquare} label="Pending Tasks" value="—" sub="Open tasks" color="text-warning" bg="bg-warning/10" />
        <StatCard variants={item} icon={Activity} label="Attendance" value="Present" sub="Today" color="text-success" bg="bg-success/10" />
      </div>

      {/* Smart Time Tracker Focus Widget */}
      <SmartTimeTrackerWidget
        variants={item}
        onLogSaved={() => {
          api
            .listTimeLogs(1, 100, { from: today, to: today })
            .then((res) => {
              const logs: TimeLog[] = res.data || [];
              setTodayHours(logs.reduce((s, l) => s + (l.hours || 0), 0));
            })
            .catch(() => {});
        }}
      />

      {/* Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeaveBalanceWidget limit={5} variants={item} />
        <AnnouncementsWidget limit={5} variants={item} />
      </div>

      {/* Today Overview */}
      <TodayOverviewWidget
        variants={item}
        items={[
          { value: `${todayHours.toFixed(1)}h`, label: "Hours Logged Today", color: "text-success", borderColor: "border-success/20" },
          { value: "—", label: "Open Tasks", color: "text-brand", borderColor: "border-brand/20" },
          { value: totalLeave, label: "Leave Days Remaining", color: "text-info", borderColor: "border-info/20" },
        ]}
      />
    </motion.div>
  );
}
