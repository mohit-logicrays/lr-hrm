"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Home,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  LayoutGrid,
  List,
  Inbox,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApplyWFHDrawer } from "@/components/wfh/ApplyWFHDrawer";
import { WFHApprovalDetailDrawer } from "@/components/wfh/WFHApprovalDetailDrawer";
import { api, type WFHRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function MyWFHPage() {
  const [items, setItems] = useState<WFHRequest[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const [applyDrawerOpen, setApplyDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WFHRequest | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.listMyWFH(page, 15, statusFilter);
      setItems(res.data || []);
      setTotalCount(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch {
      toast.error("Failed to load WFH requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [page, statusFilter]);

  async function handleCancel(id: string) {
    if (!window.confirm("Cancel this pending WFH request?")) return;
    try {
      await api.cancelWFH(id);
      toast.success("Request cancelled");
      loadData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel request");
    }
  }

  // Summary Metrics
  const pendingCount = items.filter((i) => i.status === "PENDING").length;
  const approvedCount = items.filter((i) => i.status === "APPROVED").length;
  const rejectedCount = items.filter((i) => i.status === "REJECTED").length;
  const totalDays = items
    .filter((i) => i.status === "APPROVED")
    .reduce((acc, curr) => acc + curr.days, 0);

  function getStatusBadge(status: string) {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-success/10 text-success border border-success/20 font-mono">
            <CheckCircle2 className="h-3 w-3" /> Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-error/10 text-error border border-error/20 font-mono">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-text-tertiary/10 text-text-tertiary border border-border-base font-mono">
            <AlertCircle className="h-3 w-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-warning/10 text-warning border border-warning/20 font-mono">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-text-primary flex items-center gap-2">
            <Home className="h-6 w-6 text-brand" /> Work From Home Requests
          </h1>
          <p className="text-xs text-text-tertiary mt-1">
            Manage, schedule, and review your remote work applications.
          </p>
        </div>

        <Button
          onClick={() => setApplyDrawerOpen(true)}
          className="bg-brand text-white hover:bg-brand-hover text-xs h-9 px-4 gap-1.5 font-semibold cursor-pointer shadow-2xs"
        >
          <Plus className="h-4 w-4" /> Apply WFH
        </Button>
      </div>

      {/* Bento Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border border-border-base bg-surface shadow-2xs rounded-2xl flex flex-col justify-between hover:border-brand/30 transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
              Approved Days
            </span>
            <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-text-primary font-heading">{totalDays}</span>
            <span className="text-xs text-text-tertiary ml-1">days this month</span>
          </div>
        </Card>

        <Card className="p-4 border border-border-base bg-surface shadow-2xs rounded-2xl flex flex-col justify-between hover:border-warning/30 transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-warning uppercase tracking-wider">
              Pending
            </span>
            <div className="w-8 h-8 rounded-xl bg-warning/10 text-warning flex items-center justify-center font-bold">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-text-primary font-heading">{pendingCount}</span>
            <span className="text-xs text-text-tertiary ml-1">requests</span>
          </div>
        </Card>

        <Card className="p-4 border border-border-base bg-surface shadow-2xs rounded-2xl flex flex-col justify-between hover:border-success/30 transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-success uppercase tracking-wider">
              Approved
            </span>
            <div className="w-8 h-8 rounded-xl bg-success/10 text-success flex items-center justify-center font-bold">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-text-primary font-heading">{approvedCount}</span>
            <span className="text-xs text-text-tertiary ml-1">requests</span>
          </div>
        </Card>

        <Card className="p-4 border border-border-base bg-surface shadow-2xs rounded-2xl flex flex-col justify-between hover:border-error/30 transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-error uppercase tracking-wider">
              Rejected
            </span>
            <div className="w-8 h-8 rounded-xl bg-error/10 text-error flex items-center justify-center font-bold">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-text-primary font-heading">{rejectedCount}</span>
            <span className="text-xs text-text-tertiary ml-1">requests</span>
          </div>
        </Card>
      </div>

      {/* Filters Bar & View Switcher */}
      <Card className="p-4 border border-border-base bg-surface shadow-2xs rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => {
                setPage(1);
                setStatusFilter(status);
              }}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
                statusFilter === status
                  ? "bg-brand text-white shadow-2xs"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
              )}
            >
              {status === "ALL" ? "All Requests" : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border-base rounded-lg p-0.5 bg-surface-subtle">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "p-1.5 rounded-md transition-colors cursor-pointer",
                viewMode === "table" ? "bg-surface text-brand shadow-2xs" : "text-text-tertiary hover:text-text-primary"
              )}
              title="Table View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-md transition-colors cursor-pointer",
                viewMode === "grid" ? "bg-surface text-brand shadow-2xs" : "text-text-tertiary hover:text-text-primary"
              )}
              title="Card Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </Card>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center text-xs text-text-tertiary">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent mx-auto mb-2" />
          Loading your WFH requests...
        </div>
      ) : items.length === 0 ? (
        <Card className="py-16 text-center text-xs text-text-tertiary flex flex-col items-center justify-center border-border-base bg-surface rounded-2xl shadow-2xs">
          <Inbox className="h-10 w-10 text-text-tertiary/40 mb-2" />
          <p className="font-semibold text-text-secondary text-sm">No WFH requests found</p>
          <p className="text-[11px] mt-0.5">Click "Apply WFH" to submit your first remote request.</p>
        </Card>
      ) : viewMode === "table" ? (
        <Card className="border border-border-base bg-surface rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-subtle/50 border-b border-border-base text-[11px] font-bold text-text-tertiary uppercase tracking-wider font-heading">
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base text-xs text-text-secondary">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-text-primary">
                      {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-brand font-mono">
                      {item.days} {item.days === 1 ? "day" : "days"}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-text-tertiary">
                      {item.reason.replace(/<[^>]*>?/gm, "")}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setSelectedRequest(item);
                            setDetailDrawerOpen(true);
                          }}
                          className="h-7 w-7 text-text-secondary hover:text-brand cursor-pointer"
                          title="View Details & Timeline"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>

                        {item.status === "PENDING" && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleCancel(item.id)}
                            className="h-7 w-7 text-text-secondary hover:text-error cursor-pointer"
                            title="Cancel Request"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card
              key={item.id}
              className="p-5 border border-border-base bg-surface rounded-2xl shadow-2xs hover:border-brand/30 transition-all space-y-3 cursor-pointer"
              onClick={() => {
                setSelectedRequest(item);
                setDetailDrawerOpen(true);
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs font-heading text-text-primary">
                  {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                </span>
                {getStatusBadge(item.status)}
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-brand font-semibold">
                <Clock className="h-3.5 w-3.5" /> {item.days} {item.days === 1 ? "Working Day" : "Working Days"}
              </div>

              <p className="text-xs text-text-tertiary line-clamp-2 italic">
                "{item.reason.replace(/<[^>]*>?/gm, "")}"
              </p>

              <div className="pt-2 border-t border-border-base/50 flex items-center justify-between text-[11px] text-text-tertiary">
                <span>Applied: {new Date(item.createdAt).toLocaleDateString()}</span>
                {item.status === "PENDING" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancel(item.id);
                    }}
                    className="text-error hover:underline font-semibold"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Drawers */}
      <ApplyWFHDrawer
        isOpen={applyDrawerOpen}
        onClose={() => setApplyDrawerOpen(false)}
        onSuccess={() => loadData()}
      />

      <WFHApprovalDetailDrawer
        request={selectedRequest}
        isOpen={detailDrawerOpen}
        canAction={false}
        onClose={() => setDetailDrawerOpen(false)}
        onActionCompleted={() => loadData()}
      />
    </div>
  );
}
