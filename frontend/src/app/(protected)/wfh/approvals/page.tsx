"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Eye,
  Check,
  Ban,
  Home,
  User,
  Building2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WFHApprovalDetailDrawer } from "@/components/wfh/WFHApprovalDetailDrawer";
import { useAuth } from "@/providers/auth-provider";
import { api, type WFHRequest, apiFileUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function WFHApprovalsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<WFHRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<WFHRequest | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  async function loadApprovals() {
    setLoading(true);
    try {
      const res = await api.listWFHApprovals({ search: search || undefined });
      setItems(res.data || []);
    } catch {
      toast.error("Failed to load WFH approvals");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApprovals();
  }, [search]);

  // Quick Direct Actions
  async function handleQuickApprove(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await api.approveWFH(id, "Approved via Kanban");
      toast.success("WFH request approved");
      loadApprovals();
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve");
    }
  }

  async function handleQuickReject(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const reason = window.prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      await api.rejectWFH(id, reason);
      toast.success("WFH request rejected");
      loadApprovals();
    } catch (err: any) {
      toast.error(err?.message || "Failed to reject");
    }
  }

  const pendingItems = items.filter((i) => i.status === "PENDING");
  const approvedItems = items.filter((i) => i.status === "APPROVED");
  const rejectedItems = items.filter((i) => i.status === "REJECTED");

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-text-primary flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-brand" /> WFH Approvals & Kanban
          </h1>
          <p className="text-xs text-text-tertiary mt-1">
            Supervise team remote requests with role-based authority.
          </p>
        </div>

        <div className="w-full sm:w-72 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none" />
          <Input
            type="text"
            placeholder="Search employee, reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Kanban Board Columns Container */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden min-h-0 pb-2">
        {/* Column 1: Pending */}
        <div className="flex flex-col h-full bg-surface-subtle/50 rounded-2xl border border-border-base overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-border-base bg-surface flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-warning animate-pulse" />
              <h3 className="font-heading text-sm font-bold text-text-primary">Pending Review</h3>
            </div>
            <span className="text-xs font-mono font-bold bg-warning/10 text-warning px-2 py-0.5 rounded-full">
              {pendingItems.length}
            </span>
          </div>

          <div className="p-3 overflow-y-auto space-y-3 flex-1">
            {pendingItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-text-tertiary">No pending requests</div>
            ) : (
              pendingItems.map((item) => {
                const name = `${item.user?.firstName || ""} ${item.user?.lastName || ""}`.trim() || item.user?.email;
                const isOwn = user?.id === item.userId;
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-surface border border-border-base shadow-2xs hover:border-brand/40 transition-all cursor-pointer space-y-3"
                    onClick={() => {
                      setSelectedRequest(item);
                      setDetailDrawerOpen(true);
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8 border border-border-base">
                        {item.user?.avatarUrl && <AvatarImage src={apiFileUrl(item.user.avatarUrl)} />}
                        <AvatarFallback className="text-xs font-bold bg-brand/10 text-brand">
                          {name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-bold font-heading text-text-primary truncate">{name}</p>
                        <p className="text-[11px] text-text-tertiary truncate">{item.user?.department?.name || "General"}</p>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-text-secondary font-mono">
                        <Clock className="h-3 w-3 text-brand" />
                        <span>
                          {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()} ({item.days}d)
                        </span>
                      </div>
                      <p className="text-[11px] text-text-tertiary line-clamp-2 italic">
                        "{item.reason.replace(/<[^>]*>?/gm, "")}"
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border-base/50 flex items-center justify-between">
                      <span className="text-[10px] text-text-tertiary font-mono">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      {!isOwn && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleQuickReject(item.id, e)}
                            title="Reject"
                            className="p-1 rounded-md text-error hover:bg-error/10 transition-colors cursor-pointer"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleQuickApprove(item.id, e)}
                            title="Approve"
                            className="p-1 rounded-md text-success hover:bg-success/10 transition-colors cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Approved */}
        <div className="flex flex-col h-full bg-surface-subtle/50 rounded-2xl border border-border-base overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-border-base bg-surface flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-success" />
              <h3 className="font-heading text-sm font-bold text-text-primary">Approved</h3>
            </div>
            <span className="text-xs font-mono font-bold bg-success/10 text-success px-2 py-0.5 rounded-full">
              {approvedItems.length}
            </span>
          </div>

          <div className="p-3 overflow-y-auto space-y-3 flex-1">
            {approvedItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-text-tertiary">No approved requests</div>
            ) : (
              approvedItems.map((item) => {
                const name = `${item.user?.firstName || ""} ${item.user?.lastName || ""}`.trim() || item.user?.email;
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-surface border border-border-base/60 opacity-90 shadow-2xs hover:opacity-100 transition-all cursor-pointer space-y-2.5"
                    onClick={() => {
                      setSelectedRequest(item);
                      setDetailDrawerOpen(true);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold font-heading text-text-primary">{name}</p>
                      <span className="text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                        Approved
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary font-mono">
                      {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()} ({item.days}d)
                    </p>
                    <p className="text-[11px] text-text-tertiary line-clamp-1 italic">
                      "{item.reason.replace(/<[^>]*>?/gm, "")}"
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 3: Rejected */}
        <div className="flex flex-col h-full bg-surface-subtle/50 rounded-2xl border border-border-base overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-border-base bg-surface flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-error" />
              <h3 className="font-heading text-sm font-bold text-text-primary">Rejected</h3>
            </div>
            <span className="text-xs font-mono font-bold bg-error/10 text-error px-2 py-0.5 rounded-full">
              {rejectedItems.length}
            </span>
          </div>

          <div className="p-3 overflow-y-auto space-y-3 flex-1">
            {rejectedItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-text-tertiary">No rejected requests</div>
            ) : (
              rejectedItems.map((item) => {
                const name = `${item.user?.firstName || ""} ${item.user?.lastName || ""}`.trim() || item.user?.email;
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-surface border border-border-base/60 opacity-80 shadow-2xs hover:opacity-100 transition-all cursor-pointer space-y-2.5"
                    onClick={() => {
                      setSelectedRequest(item);
                      setDetailDrawerOpen(true);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold font-heading text-text-primary">{name}</p>
                      <span className="text-[10px] font-semibold text-error bg-error/10 px-2 py-0.5 rounded-full">
                        Rejected
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary font-mono line-through">
                      {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()} ({item.days}d)
                    </p>
                    {item.rejectionReason && (
                      <p className="text-[11px] text-error font-medium">
                        Reason: {item.rejectionReason}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <WFHApprovalDetailDrawer
        request={selectedRequest}
        isOpen={detailDrawerOpen}
        canAction={Boolean(selectedRequest && user?.id && selectedRequest.userId !== user.id)}
        onClose={() => setDetailDrawerOpen(false)}
        onActionCompleted={() => loadApprovals()}
      />
    </div>
  );
}
