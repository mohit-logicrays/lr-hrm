"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  X,
  Check,
  Ban,
  Calendar,
  Home,
  User,
  BadgeCheck,
  MessageSquare,
  Clock,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ApprovalTimeline } from "@/components/approval/ApprovalTimeline";
import { api, type WFHRequest, type ApprovalLogItem, apiFileUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

interface WFHApprovalDetailDrawerProps {
  request: WFHRequest | null;
  isOpen: boolean;
  canAction?: boolean;
  onClose: () => void;
  onActionCompleted: (updated: WFHRequest) => void;
}

export function WFHApprovalDetailDrawer({
  request,
  isOpen,
  canAction = true,
  onClose,
  onActionCompleted,
}: WFHApprovalDetailDrawerProps) {
  const [comment, setComment] = useState("");
  const [logs, setLogs] = useState<ApprovalLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (request?.id && isOpen) {
      setLoadingLogs(true);
      api
        .getWFHLogs(request.id)
        .then((res) => setLogs(res.data || []))
        .catch(() => setLogs([]))
        .finally(() => setLoadingLogs(false));
    }
  }, [request?.id, isOpen]);

  if (!isOpen || !request) return null;

  const applicantName = `${request.user?.firstName || ""} ${request.user?.lastName || ""}`.trim() || request.user?.email || "Employee";
  const deptName = request.user?.department?.name || "General";
  const designation = request.user?.designation || request.user?.role?.displayName || "Member";

  async function handleApprove() {
    setSubmitting(true);
    try {
      const res = await api.approveWFH(request!.id, comment);
      toast.success("WFH request approved");
      onActionCompleted(res.data);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve request");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!comment.trim()) {
      toast.error("A rejection reason is mandatory");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.rejectWFH(request!.id, comment);
      toast.success("WFH request rejected");
      onActionCompleted(res.data);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to reject request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="w-full max-w-lg bg-surface h-full shadow-2xl border-l border-border-base flex flex-col slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-border-base flex items-center justify-between bg-surface-subtle/50 shrink-0">
          <div>
            <h2 className="font-heading text-base font-bold text-text-primary">Review WFH Request</h2>
            <p className="text-xs text-text-tertiary mt-0.5">Details and approval audit timeline</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Employee Header Card */}
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-surface-subtle border border-border-base shadow-2xs">
            <Avatar className="h-12 w-12 border-2 border-surface shrink-0">
              {request.user?.avatarUrl && <AvatarImage src={apiFileUrl(request.user.avatarUrl)} />}
              <AvatarFallback className="text-sm font-bold bg-brand/10 text-brand">
                {applicantName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="font-heading text-sm font-bold text-text-primary truncate">{applicantName}</h3>
              <p className="text-xs text-text-tertiary mt-0.5 truncate">{designation} • {deptName}</p>
              <p className="text-[11px] text-text-tertiary font-mono">{request.user?.email}</p>
            </div>
          </div>

          {/* Request Info Bento */}
          <div className="p-4 rounded-2xl bg-surface border border-border-base space-y-3 shadow-2xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Duration</span>
                <p className="text-xs font-bold text-text-primary font-heading mt-0.5 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-brand" /> {request.days} {request.days === 1 ? "Day" : "Days"}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Date Range</span>
                <p className="text-xs font-semibold text-text-primary font-mono mt-0.5">
                  {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-border-base/60">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Reason / Description</span>
              <div
                className="p-3 rounded-xl bg-surface-subtle border border-border-base/40 text-xs text-text-secondary leading-relaxed prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:my-0.5"
                dangerouslySetInnerHTML={{ __html: request.reason }}
              />
            </div>
          </div>

          {/* Approval Audit Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold font-heading text-text-primary uppercase tracking-wider">
              Approval Timeline
            </h4>
            <ApprovalTimeline logs={logs} loading={loadingLogs} />
          </div>
        </div>

        {/* Drawer Action Footer (Only for PENDING status and when user is eligible approver) */}
        {request.status === "PENDING" && canAction && (
          <div className="p-5 border-t border-border-base bg-surface-subtle/50 shrink-0 space-y-3">
            <div>
              <label htmlFor="drawer-comment" className="text-[11px] font-semibold text-text-secondary block mb-1">
                Approval Comment / Rejection Reason
              </label>
              <textarea
                id="drawer-comment"
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter notes or rejection justification..."
                className="w-full rounded-xl border border-border-base p-2.5 text-xs text-text-primary bg-surface focus:outline-none focus:border-brand resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={handleReject}
                className="flex-1 text-xs h-9 border-error/30 text-error hover:bg-error/10 cursor-pointer font-semibold gap-1.5"
              >
                <Ban className="h-3.5 w-3.5" /> Reject
              </Button>

              <Button
                type="button"
                disabled={submitting}
                onClick={handleApprove}
                className="flex-1 text-xs h-9 bg-success hover:bg-success/90 text-white cursor-pointer font-semibold gap-1.5 shadow-2xs"
              >
                <Check className="h-3.5 w-3.5" /> Approve
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
