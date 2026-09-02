"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/providers/auth-provider";
import { MyTimesheetTab } from "@/components/time/MyTimesheetTab";
import { TeamApprovalsTab } from "@/components/time/TeamApprovalsTab";
import { TimesheetReportsTab } from "@/components/time/TimesheetReportsTab";
import {
  CalendarDays,
  Clock,
  CheckSquare,
  BarChart3,
  Users,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25 } },
};

export default function TimeManagementPage() {
  const { user } = useAuth();
  const roleName = typeof user?.role === "string" ? user.role : (user?.role as any)?.name || "";
  const roleUpper = roleName.toUpperCase();

  const isLeadOrAbove = ["SUPERADMIN", "HR_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD", "PROJECT_MANAGER"].includes(roleUpper);

  const [activeTab, setActiveTab] = useState<"my" | "team" | "reports">("my");

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 flex flex-col min-h-[calc(100vh-100px)]"
    >
      {/* Top Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary tracking-tight">
            Time & Timesheet Management
          </h1>
          <p className="text-xs text-text-tertiary mt-1">
            Track daily and weekly working hours, submit timesheets, and review team utilization.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center rounded-lg border border-border-base bg-surface p-1 shadow-2xs">
          <button
            onClick={() => setActiveTab("my")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all",
              activeTab === "my" ? "bg-brand text-white shadow-2xs" : "text-text-tertiary hover:text-text-primary"
            )}
          >
            <Clock className="h-3.5 w-3.5" /> My Timesheet
          </button>

          {isLeadOrAbove && (
            <>
              <button
                onClick={() => setActiveTab("team")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all",
                  activeTab === "team" ? "bg-brand text-white shadow-2xs" : "text-text-tertiary hover:text-text-primary"
                )}
              >
                <Users className="h-3.5 w-3.5" /> Team Approvals
              </button>

              <button
                onClick={() => setActiveTab("reports")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all",
                  activeTab === "reports" ? "bg-brand text-white shadow-2xs" : "text-text-tertiary hover:text-text-primary"
                )}
              >
                <BarChart3 className="h-3.5 w-3.5" /> Timesheet Reports
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* Main Workspace Content (AnimatePresence view transitions) */}
      <motion.div variants={itemVariants} className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === "my" && (
            <motion.div
              key="my-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <MyTimesheetTab />
            </motion.div>
          )}

          {activeTab === "team" && isLeadOrAbove && (
            <motion.div
              key="team-tab"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TeamApprovalsTab />
            </motion.div>
          )}

          {activeTab === "reports" && isLeadOrAbove && (
            <motion.div
              key="reports-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TimesheetReportsTab />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}