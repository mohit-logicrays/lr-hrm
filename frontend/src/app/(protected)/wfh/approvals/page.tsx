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
  GripVertical,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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

  // Drag & Drop State
  const [draggedRequestId, setDraggedRequestId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<"PENDING" | "APPROVED" | "REJECTED" | null>(null);

  // Rejection Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetRejectRequest, setTargetRejectRequest] = useState<WFHRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectAcknowledged, setRejectAcknowledged] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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
  async function handleQuickApprove(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    try {
      await api.approveWFH(id, "Approved via Kanban");
      toast.success("WFH request approved");
      loadApprovals();
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve");
    }
  }

  function openRejectModal(request: WFHRequest, e?: React.MouseEvent) {
    e?.stopPropagation();
    setTargetRejectRequest(request);
    setRejectReason("");
    setRejectAcknowledged(false);
    setRejectModalOpen(true);
  }

  async function handleConfirmReject() {
    if (!targetRejectRequest) return;
    if (!rejectReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }
    if (!rejectAcknowledged) {
      toast.error("Please acknowledge the rejection before submitting");
      return;
    }

    setActionLoading(true);
    try {
      await api.rejectWFH(targetRejectRequest.id, rejectReason.trim());
      toast.success("WFH request rejected successfully");
      setRejectModalOpen(false);
      setTargetRejectRequest(null);
      loadApprovals();
    } catch (err: any) {
      toast.error(err?.message || "Failed to reject WFH request");
    } finally {
      setActionLoading(false);
    }
  }

  // HTML5 Drag and Drop Handlers
  function handleDragStart(e: React.DragEvent, request: WFHRequest) {
    if (user?.id === request.userId) {
      e.preventDefault();
      toast.error("You cannot change approval status on your own request");
      return;
    }
    setDraggedRequestId(request.id);
    e.dataTransfer.setData("text/plain", request.id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragEnd() {
    setDraggedRequestId(null);
    setDragOverColumn(null);
  }

  function handleDragOver(e: React.DragEvent, column: "PENDING" | "APPROVED" | "REJECTED") {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== column) {
      setDragOverColumn(column);
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
  }

  async function handleDrop(e: React.DragEvent, targetStatus: "PENDING" | "APPROVED" | "REJECTED") {
    e.preventDefault();
    setDragOverColumn(null);
    const reqId = e.dataTransfer.getData("text/plain") || draggedRequestId;
    if (!reqId) return;

    const request = items.find((i) => i.id === reqId);
    if (!request) return;

    if (request.status === targetStatus) return;

    if (targetStatus === "APPROVED") {
      await handleQuickApprove(reqId);
    } else if (targetStatus === "REJECTED") {
      openRejectModal(request);
    } else if (targetStatus === "PENDING") {
      toast.info("Requests already reviewed cannot be reverted to Pending via drag-and-drop.");
    }
    setDraggedRequestId(null);
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
            Supervise team remote requests with role-based authority & drag-and-drop board.
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
        <div
          onDragOver={(e) => handleDragOver(e, "PENDING")}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, "PENDING")}
          className={cn(
            "flex flex-col h-full bg-surface-subtle/50 rounded-2xl border transition-all overflow-hidden shadow-2xs",
            dragOverColumn === "PENDING" ? "border-warning bg-warning/5 ring-2 ring-warning/20" : "border-border-base"
          )}
        >
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
                const isDragging = draggedRequestId === item.id;
                return (
                  <motion.div
                    key={item.id}
                    layout
                    draggable={!isOwn}
                    onDragStart={(e) => handleDragStart(e as any, item)}
                    onDragEnd={handleDragEnd}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: isDragging ? 0.4 : 1, y: 0 }}
                    className={cn(
                      "p-4 rounded-xl bg-surface border border-border-base shadow-2xs hover:border-brand/40 transition-all cursor-grab active:cursor-grabbing space-y-3",
                      isDragging && "scale-95 border-dashed border-brand"
                    )}
                    onClick={() => {
                      setSelectedRequest(item);
                      setDetailDrawerOpen(true);
                    }}
                  >
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-8 w-8 border border-border-base shrink-0">
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
                      {!isOwn && (
                        <GripVertical className="h-4 w-4 text-text-tertiary/60 shrink-0" />
                      )}
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
                            onClick={(e) => openRejectModal(item, e)}
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

        {/* Column 2: Approved (Drop Target) */}
        <div
          onDragOver={(e) => handleDragOver(e, "APPROVED")}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, "APPROVED")}
          className={cn(
            "flex flex-col h-full bg-surface-subtle/50 rounded-2xl border transition-all overflow-hidden shadow-2xs",
            dragOverColumn === "APPROVED" ? "border-success bg-success/5 ring-2 ring-success/20" : "border-border-base"
          )}
        >
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
              <div className="py-12 text-center text-xs text-text-tertiary">
                {dragOverColumn === "APPROVED" ? "Drop here to approve" : "No approved requests"}
              </div>
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

        {/* Column 3: Rejected (Drop Target) */}
        <div
          onDragOver={(e) => handleDragOver(e, "REJECTED")}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, "REJECTED")}
          className={cn(
            "flex flex-col h-full bg-surface-subtle/50 rounded-2xl border transition-all overflow-hidden shadow-2xs",
            dragOverColumn === "REJECTED" ? "border-error bg-error/5 ring-2 ring-error/20" : "border-border-base"
          )}
        >
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
              <div className="py-12 text-center text-xs text-text-tertiary">
                {dragOverColumn === "REJECTED" ? "Drop here to reject" : "No rejected requests"}
              </div>
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

      {/* Structured Rejection Modal with Mandatory Acknowledgement */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-md bg-surface p-6">
          <DialogHeader className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-error/10 text-error flex items-center justify-center">
              <Ban className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold font-heading text-text-primary">
              Reject WFH Request
            </DialogTitle>
            <DialogDescription className="text-xs text-text-tertiary">
              Provide a clear rationale for declining remote work for{" "}
              <span className="font-semibold text-text-primary">
                {targetRejectRequest?.user?.firstName} {targetRejectRequest?.user?.lastName}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">
                Rejection Reason <span className="text-error">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Critical in-person workshop scheduled, client meeting requires physical presence..."
                rows={3}
                className="w-full text-xs p-3 rounded-lg border border-border-base bg-surface text-text-primary focus:border-error focus:outline-none"
              />
            </div>

            <div className="p-3 rounded-lg border border-border-base bg-surface-subtle/50 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="ack-wfh-reject"
                checked={rejectAcknowledged}
                onChange={(e) => setRejectAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border-base text-error focus:ring-error accent-error cursor-pointer"
              />
              <label htmlFor="ack-wfh-reject" className="text-xs text-text-secondary leading-snug cursor-pointer">
                I acknowledge that declining this WFH application will notify the applicant immediately and mark the request as permanently rejected.
              </label>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-border-base flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRejectModalOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={actionLoading || !rejectAcknowledged || !rejectReason.trim()}
              onClick={handleConfirmReject}
              className="bg-error hover:bg-error/90 text-white font-bold"
            >
              {actionLoading ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

