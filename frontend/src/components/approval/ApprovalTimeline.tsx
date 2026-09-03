"use client";

import { motion } from "framer-motion";
import { Check, Clock, X, AlertCircle, User, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type ApprovalLogItem, apiFileUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ApprovalTimelineProps {
  logs: ApprovalLogItem[];
  loading?: boolean;
}

export function ApprovalTimeline({ logs, loading }: ApprovalTimelineProps) {
  if (loading) {
    return (
      <div className="py-6 text-center text-xs text-text-tertiary animate-pulse">
        Loading approval timeline...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-text-tertiary">
        No approval history recorded yet.
      </div>
    );
  }

  function getActionBadge(action: string) {
    switch (action) {
      case "SUBMITTED":
        return { icon: Clock, color: "bg-info text-white", label: "Request Submitted" };
      case "APPROVED":
        return { icon: Check, color: "bg-success text-white", label: "Approved" };
      case "REJECTED":
        return { icon: X, color: "bg-error text-white", label: "Rejected" };
      case "CANCELLED":
        return { icon: AlertCircle, color: "bg-text-tertiary text-white", label: "Cancelled" };
      default:
        return { icon: Clock, color: "bg-brand text-white", label: action };
    }
  }

  return (
    <div className="relative pl-6 space-y-5 before:absolute before:inset-y-2 before:left-2.5 before:w-0.5 before:bg-border-base">
      {logs.map((log, idx) => {
        const badge = getActionBadge(log.action);
        const Icon = badge.icon;
        const performerName = `${log.performedBy?.firstName || ""} ${log.performedBy?.lastName || ""}`.trim() || log.performedBy?.email || "User";
        const role = log.performedBy?.role?.displayName || log.performedBy?.role?.name || log.performedBy?.designation || "";
        
        let dateStr = "Just now";
        try {
          const d = new Date(log.createdAt);
          dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
        } catch {}

        return (
          <motion.div
            key={log.id || idx}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="relative flex items-start gap-3"
          >
            {/* Step Icon */}
            <div className={cn("absolute -left-6 rounded-full w-5 h-5 flex items-center justify-center border-2 border-surface z-10 shadow-2xs", badge.color)}>
              <Icon className="h-3 w-3" />
            </div>

            <div className="flex-1 bg-surface-subtle/50 rounded-xl p-3 border border-border-base/60 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-heading font-bold text-text-primary">
                  {badge.label}
                </p>
                <span className="text-[10px] text-text-tertiary font-mono">
                  {dateStr}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-text-secondary">
                <Avatar className="h-5 w-5 border border-border-base">
                  {log.performedBy?.avatarUrl && (
                    <AvatarImage src={apiFileUrl(log.performedBy.avatarUrl)} />
                  )}
                  <AvatarFallback className="text-[9px] font-bold bg-brand/10 text-brand">
                    {performerName[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-text-primary">{performerName}</span>
                {role && <span className="text-text-tertiary font-normal">({role})</span>}
              </div>

              {log.comment && (
                <div className="mt-1 flex items-start gap-1.5 text-[11px] text-text-secondary bg-surface p-2 rounded-lg border border-border-base/50">
                  <MessageSquare className="h-3 w-3 text-text-tertiary shrink-0 mt-0.5" />
                  <p className="italic">"{log.comment}"</p>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
