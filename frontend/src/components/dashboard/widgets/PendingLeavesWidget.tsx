"use client";

import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ClipboardList, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { api, type LeaveRequest, type LeaveRequestStatus } from "@/lib/api";

export interface PendingLeavesWidgetProps {
  /** HR approves as "HR", TL approves as "TL" */
  approvalRole?: "HR" | "TL" | "PM";
  /** Whether to show Approve/Reject buttons */
  showActions?: boolean;
  limit?: number;
  variants?: Variants;
}

/**
 * Pending leave requests list with optional inline approve/reject.
 * Shared between Team Lead dashboard (showActions=false) and HR dashboard (showActions=true).
 */
export function PendingLeavesWidget({
  approvalRole = "HR",
  showActions = true,
  limit = 8,
  variants,
}: PendingLeavesWidgetProps) {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api
      .listLeaveRequests(1, limit, { status: "PENDING" })
      .then((res) => setLeaves(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [limit]);

  const handleAction = async (id: string, status: LeaveRequestStatus) => {
    setActionId(id);
    try {
      await api.approveLeaveRequest(id, status as "APPROVED" | "REJECTED", approvalRole);
      toast.success(status === "APPROVED" ? "Leave approved" : "Leave rejected");
      setLeaves((prev) => prev.filter((l) => l.id !== id));
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <motion.div variants={variants} className="h-full">
      <Card className="p-6 bg-surface border border-border-base rounded-2xl shadow-2xs h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-brand" />
            <h2 className="font-heading font-bold text-base text-text-primary">
              Pending Leave Requests
            </h2>
          </div>
          {leaves.length > 0 && (
            <Badge className="bg-error/10 text-error border-error/30 text-xs font-bold">
              {leaves.length} pending
            </Badge>
          )}
        </div>

        {/* Body */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-surface-subtle rounded-xl animate-pulse" />
            ))}
          </div>
        ) : leaves.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <CheckCircle2 className="h-10 w-10 text-success opacity-60" />
            <p className="text-sm text-text-tertiary">All caught up! No pending requests.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaves.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border-base bg-surface-subtle"
              >
                <Avatar className="h-9 w-9 border border-border-base shrink-0">
                  <AvatarFallback className="bg-brand/10 text-brand font-bold text-xs">
                    {req.user?.firstName?.[0] ?? "U"}
                    {req.user?.lastName?.[0] ?? ""}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-text-primary line-clamp-1">
                    {req.user?.firstName} {req.user?.lastName}
                  </p>
                  <p className="text-[10px] text-text-tertiary">
                    {req.leaveType?.name} · {req.days} day{req.days !== 1 ? "s" : ""}{" "}
                    · {new Date(req.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </p>
                </div>

                {showActions ? (
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      className="h-7 px-2.5 text-xs bg-success hover:bg-success/90 text-white rounded-lg"
                      disabled={actionId === req.id}
                      onClick={() => handleAction(req.id, "APPROVED")}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-xs text-error border-error/30 hover:bg-error/10 rounded-lg"
                      disabled={actionId === req.id}
                      onClick={() => handleAction(req.id, "REJECTED")}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Reject
                    </Button>
                  </div>
                ) : (
                  <Badge className="bg-warning/10 text-warning border-warning/30 text-[10px] shrink-0">
                    Pending
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
