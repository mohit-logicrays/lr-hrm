"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Clock, AlertTriangle, CheckSquare } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { api, type Project, type TimeLog } from "@/lib/api";
import { Card } from "@/components/ui/card";

import {
  WelcomeBanner,
  StatCard,
  ProjectProgressWidget,
} from "./widgets";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function PMDashboard() {
  const { user } = useAuth();
  const firstName = user?.firstName || user?.name?.split(" ")[0] || "there";

  const [activeCount, setActiveCount] = useState(0);
  const [onHoldCount, setOnHoldCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [todayHours, setTodayHours] = useState(0);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    api
      .listProjects(1, 50)
      .then((res) => {
        const projects: Project[] = res.data || [];
        setActiveCount(projects.filter((p) => p.status === "ACTIVE").length);
        setOnHoldCount(projects.filter((p) => p.status === "ON_HOLD").length);
        setTotalCount(projects.length);
      })
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
        <StatCard variants={item} icon={Briefcase} label="Active Projects" value={activeCount} sub="In progress" color="text-brand" bg="bg-brand/10" />
        <StatCard variants={item} icon={CheckSquare} label="Tasks Due" value="—" sub="This week" color="text-warning" bg="bg-warning/10" />
        <StatCard variants={item} icon={Clock} label="My Hours Today" value={`${todayHours.toFixed(1)}h`} sub="Logged" color="text-info" bg="bg-info/10" />
        <StatCard variants={item} icon={AlertTriangle} label="On Hold" value={onHoldCount} sub="Projects paused" color="text-error" bg="bg-error/10" />
      </div>

      {/* Projects Progress Widget */}
      <ProjectProgressWidget
        statusFilter="ACTIVE"
        limit={6}
        title="Active Project Progress"
        variants={item}
      />

      {/* Summary mini-cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "My Hours Today", value: `${todayHours.toFixed(1)}h`, color: "text-brand", iconColor: "text-brand", bg: "bg-brand/5 border-brand/20" },
          { label: "Total Projects", value: totalCount, color: "text-info", iconColor: "text-info", bg: "bg-info/5 border-info/20" },
          { label: "Projects On Hold", value: onHoldCount, color: "text-warning", iconColor: "text-warning", bg: "bg-warning/5 border-warning/20" },
        ].map((s) => (
          <motion.div key={s.label} variants={item}>
            <Card className={`p-5 border rounded-2xl shadow-2xs text-center ${s.bg}`}>
              <p className={`text-2xl font-extrabold font-heading ${s.color}`}>{s.value}</p>
              <p className="text-xs text-text-tertiary mt-1">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
