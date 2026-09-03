"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  api,
  type LeaveRequest,
  type LeaveType,
  type LeaveBalance,
  type User,
  type LeaveRequestStatus,
  type ApprovalLogItem,
} from "@/lib/api";
import { usePermission, useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ApplyLeaveSheet } from "@/components/leave/ApplyLeaveSheet";
import { EditLeaveSheet } from "@/components/leave/EditLeaveSheet";
import { CalendarDayDialog } from "@/components/leave/CalendarDayDialog";
import { RichTextViewer } from "@/components/ui/rich-text-editor";
import { ApprovalTimeline } from "@/components/approval/ApprovalTimeline";
import {
  Calendar,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Filter,
  Inbox,
  Plus,
  Search,
  Users,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  ShieldCheck,
  Sparkles,
  Pencil,
  Sun,
  Sunset,
  Eye,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

type LeaveTab = "my_leaves" | "team_requests" | "calendar" | "policies";

export default function LeaveManagementPage() {
  const { user } = useAuth();
  const perms = usePermission("leave");
  const userPerms = usePermission("user");
  const canApprove = Boolean(perms.approve || perms.read_all);

  // Check if current user has HR Admin / Superadmin role for HR-only actions
  const roleName = typeof user?.role === "string" ? user.role : (user?.role as any)?.name || "";
  const isHr =
    ["SUPERADMIN", "HR_ADMIN", "ADMIN", "HR"].includes(roleName.toUpperCase()) ||
    Boolean(perms.type_manage || perms.balance_manage || user?.isSpecialRole);

  const [activeTab, setActiveTab] = useState<LeaveTab>(() => (isHr || canApprove ? "team_requests" : "my_leaves"));
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [myBalances, setMyBalances] = useState<LeaveBalance[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Sheet / Modal States
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);

  // Calendar State & Day Preview Dialog
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);

  // Modal Confirmations with Acknowledgement Checkboxes
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: "reject" | "cancel" | "delete_type";
    targetId: string;
    extraLabel?: string;
  }>({
    isOpen: false,
    title: "",
    description: "",
    type: "reject",
    targetId: "",
  });

  const [confirmReason, setConfirmReason] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Leave Type Create Modal State
  const [createTypeModal, setCreateTypeModal] = useState(false);
  const [typeForm, setTypeForm] = useState({
    name: "",
    code: "",
    maxDaysPerYear: "12",
    isPaid: true,
  });

  // Approval Timeline Drawer / Modal State
  const [timelineRequest, setTimelineRequest] = useState<LeaveRequest | null>(null);
  const [timelineLogs, setTimelineLogs] = useState<ApprovalLogItem[]>([]);
  const [loadingTimelineLogs, setLoadingTimelineLogs] = useState(false);

  async function openTimelineModal(request: LeaveRequest) {
    setTimelineRequest(request);
    setLoadingTimelineLogs(true);
    try {
      const res = await api.getLeaveLogs(request.id);
      setTimelineLogs(res.data || []);
    } catch {
      setTimelineLogs([]);
    } finally {
      setLoadingTimelineLogs(false);
    }
  }

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [reqsRes, typesRes, balRes] = await Promise.all([
        api.listLeaveRequests(1, 100),
        api.listLeaveTypes(1, 50),
        api.getLeaveBalance(),
      ]);

      setRequests(reqsRes.data);
      setLeaveTypes(typesRes.data);
      setMyBalances(balRes.data?.balances || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load leave management data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load users for the HR/manager approval views — best-effort and
  // non-blocking so a missing user:read permission doesn't hide leave data.
  useEffect(() => {
    if (!userPerms.read) return;
    const loadUsers = async () => {
      try {
        const usersRes = await api.listUsers(1, 100);
        setUsers(usersRes.data);
      } catch {
        /* secondary lookups are optional */
      }
    };
    loadUsers();
  }, [loadData, userPerms.read]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Multi-Level Approval Stage Handler (TL, PM, HR)
  async function handleApproveStage(id: string, approvalRole: "TL" | "PM" | "HR" = "HR") {
    try {
      await api.approveLeaveRequest(id, "APPROVED", approvalRole);
      toast.success(`${approvalRole} approval recorded for leave request`);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve request");
    }
  }

  function openRejectModal(request: LeaveRequest) {
    setConfirmModal({
      isOpen: true,
      title: "Reject Leave Request",
      description: `You are rejecting the leave request submitted by ${request.user?.firstName || "employee"} (${request.days} days).`,
      type: "reject",
      targetId: request.id,
      extraLabel: "Provide a reason for rejection (required):",
    });
    setConfirmReason("");
    setAcknowledged(false);
  }

  function openCancelModal(request: LeaveRequest) {
    setConfirmModal({
      isOpen: true,
      title: "Cancel Leave Request",
      description: `Are you sure you want to cancel this ${request.days}-day leave request (${request.startDate} to ${request.endDate})?`,
      type: "cancel",
      targetId: request.id,
    });
    setConfirmReason("");
    setAcknowledged(false);
  }

  function openDeleteTypeModal(type: LeaveType) {
    setConfirmModal({
      isOpen: true,
      title: `Delete Leave Type: ${type.name}`,
      description: `This will permanently remove the "${type.name}" (${type.code}) leave category from the system.`,
      type: "delete_type",
      targetId: type.id,
    });
    setConfirmReason("");
    setAcknowledged(false);
  }

  async function handleConfirmModalSubmit() {
    if (!acknowledged) {
      toast.error("Please check the confirmation acknowledgement box");
      return;
    }

    if (confirmModal.type === "reject" && !confirmReason.trim()) {
      toast.error("Please enter a reason for rejection");
      return;
    }

    try {
      setModalLoading(true);
      if (confirmModal.type === "reject") {
        await api.approveLeaveRequest(confirmModal.targetId, "REJECTED", "HR", confirmReason);
        toast.success("Leave request rejected");
      } else if (confirmModal.type === "cancel") {
        await api.cancelLeaveRequest(confirmModal.targetId);
        toast.success("Leave request cancelled");
      } else if (confirmModal.type === "delete_type") {
        await api.deleteLeaveType(confirmModal.targetId);
        toast.success("Leave type deleted");
      }
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setModalLoading(false);
    }
  }

  async function handleCreateLeaveType(e: React.FormEvent) {
    e.preventDefault();
    if (!typeForm.name.trim() || !typeForm.code.trim()) {
      toast.error("Please fill in leave type name and code");
      return;
    }

    try {
      setModalLoading(true);
      await api.createLeaveType({
        name: typeForm.name.trim(),
        code: typeForm.code.trim().toUpperCase(),
        maxDaysPerYear: typeForm.maxDaysPerYear ? parseInt(typeForm.maxDaysPerYear, 10) : null,
        isPaid: typeForm.isPaid,
      });
      toast.success("Leave type created successfully");
      setCreateTypeModal(false);
      setTypeForm({ name: "", code: "", maxDaysPerYear: "12", isPaid: true });
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create leave type");
    } finally {
      setModalLoading(false);
    }
  }

  // Calendar Navigation
  function handlePrevMonth() {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  }

  function handleNextMonth() {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  }

  // Metrics
  const totalBalance = myBalances.reduce((acc, b) => acc + (b.allocated - b.used), 0);
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedThisMonth = requests.filter((r) => r.status === "APPROVED").length;

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    if (activeTab === "my_leaves" && r.userId !== user?.id) return false;
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const uName = `${r.user?.firstName || ""} ${r.user?.lastName || ""}`.toLowerCase();
      const typeName = r.leaveType?.name.toLowerCase() || "";
      if (!uName.includes(q) && !typeName.includes(q)) return false;
    }
    return true;
  });

  // Calendar Days calculation
  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthName = calendarDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="space-y-6 flex flex-col min-h-[calc(100vh-100px)]">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary tracking-tight">
            Leave Management
          </h1>
          <p className="text-xs text-text-tertiary mt-1">
            Manage team time off, track balances, and approve requests.
          </p>
        </div>

        <Button
          onClick={() => setIsApplyOpen(true)}
          className="bg-brand hover:bg-brand-hover text-white px-5 py-2 rounded-lg font-semibold text-xs shadow-2xs gap-2 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Apply Leave
        </Button>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Available Balance */}
        <Card className="p-5 border border-border-base bg-surface rounded-xl shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden group space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold">
              <CalendarDays className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              My Entitlement
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-heading text-3xl font-extrabold text-text-primary">
                {totalBalance > 0 ? totalBalance : 18}
              </span>
              <span className="text-xs font-semibold text-text-tertiary">Days Available</span>
            </div>
            <p className="text-[11px] text-success font-semibold flex items-center gap-1 mt-1">
              <CheckCircle2 className="h-3 w-3" /> Accrued this month
            </p>
          </div>
        </Card>

        {/* Card 2: Pending Requests */}
        <Card className="p-5 border border-border-base bg-surface rounded-xl shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden group space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-warning/10 text-warning flex items-center justify-center font-bold">
              <Inbox className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              Action Needed
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-heading text-3xl font-extrabold text-text-primary">
                {pendingCount}
              </span>
              <span className="text-xs font-semibold text-text-tertiary">Pending Requests</span>
            </div>
            <p className="text-[11px] text-warning font-semibold flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" /> 3 Approvals Required (TL + PM + HR)
            </p>
          </div>
        </Card>

        {/* Card 3: Approved this Month */}
        <Card className="p-5 border border-border-base bg-surface rounded-xl shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden group space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center font-bold">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              Monthly Total
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-heading text-3xl font-extrabold text-text-primary">
                {approvedThisMonth}
              </span>
              <span className="text-xs font-semibold text-text-tertiary">Approved Requests</span>
            </div>
            <p className="text-[11px] text-text-tertiary font-semibold flex items-center gap-1 mt-1">
              Across all departments
            </p>
          </div>
        </Card>

        {/* Card 4: Team on Leave Today */}
        <Card className="p-5 border border-border-base bg-surface rounded-xl shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden group space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-info/10 text-info flex items-center justify-center font-bold">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex -space-x-2">
              {users.slice(0, 3).map((u) => (
                <div
                  key={u.id}
                  className="w-7 h-7 rounded-full bg-brand/10 text-brand font-mono font-bold flex items-center justify-center text-[10px] border-2 border-surface"
                >
                  {u.firstName?.[0]}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-heading text-3xl font-extrabold text-text-primary">3</span>
              <span className="text-xs font-semibold text-text-tertiary">On Leave Today</span>
            </div>
            <p className="text-[11px] text-text-tertiary font-semibold mt-1">
              Out of office schedule
            </p>
          </div>
        </Card>
      </div>

      {/* Main Content Layout (70% Left Requests Table | 30% Right Calendar & Who's Out) */}
      <div className="grid grid-cols-12 gap-6 flex-1">
        {/* Left Column (70% - lg:col-span-8) */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <Card className="border border-border-base bg-surface rounded-xl shadow-2xs overflow-hidden flex flex-col">
            {/* Tabs Header */}
            <div className="flex items-center justify-between border-b border-border-base px-6 pt-3 bg-surface-subtle/30">
              <div className="flex space-x-6">
                <button
                  onClick={() => setActiveTab("my_leaves")}
                  className={cn(
                    "py-3 font-semibold text-xs transition-colors border-b-2 cursor-pointer",
                    activeTab === "my_leaves"
                      ? "border-brand text-brand font-bold"
                      : "border-transparent text-text-tertiary hover:text-text-primary"
                  )}
                >
                  My Leaves
                </button>
                {(isHr || canApprove) && (
                  <button
                    onClick={() => setActiveTab("team_requests")}
                    className={cn(
                      "py-3 font-semibold text-xs transition-colors border-b-2 cursor-pointer",
                      activeTab === "team_requests"
                        ? "border-brand text-brand font-bold"
                        : "border-transparent text-text-tertiary hover:text-text-primary"
                    )}
                  >
                    {isHr ? "All Leave Requests" : "Team Requests"}
                  </button>
                )}
                <button
                  onClick={() => setActiveTab("calendar")}
                  className={cn(
                    "py-3 font-semibold text-xs transition-colors border-b-2 cursor-pointer",
                    activeTab === "calendar"
                      ? "border-brand text-brand font-bold"
                      : "border-transparent text-text-tertiary hover:text-text-primary"
                  )}
                >
                  Leave Calendar
                </button>
                <button
                  onClick={() => setActiveTab("policies")}
                  className={cn(
                    "py-3 font-semibold text-xs transition-colors border-b-2 cursor-pointer",
                    activeTab === "policies"
                      ? "border-brand text-brand font-bold"
                      : "border-transparent text-text-tertiary hover:text-text-primary"
                  )}
                >
                  Leave Policies
                </button>
              </div>

              {/* Filter & Export Controls */}
              <div className="flex items-center gap-2 pb-2">
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
                  <input
                    className="w-full h-8 pl-8 pr-2 bg-surface border border-border-base rounded-md text-xs focus:border-brand focus:outline-none"
                    placeholder="Search employee..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <select
                  className="h-8 rounded-md border border-border-base bg-surface px-2 text-xs font-medium text-text-primary focus:border-brand focus:outline-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            {/* Table Content */}
            {activeTab === "team_requests" || activeTab === "my_leaves" ? (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-subtle/40 border-b border-border-base text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                      <th className="py-3 px-6">Employee</th>
                      <th className="py-3 px-6">Leave Type & Details</th>
                      <th className="py-3 px-6">Dates & Days</th>
                      <th className="py-3 px-6">3-Level Approval (TL / PM / HR)</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-base/50 text-xs">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-text-tertiary">
                          Loading leave requests...
                        </td>
                      </tr>
                    ) : filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-text-tertiary">
                          No leave requests found.
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((r) => (
                        <tr key={r.id} className="hover:bg-surface-subtle/30 transition-colors group">
                          {/* Employee */}
                          <td className="py-3 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-brand/10 text-brand font-mono font-bold flex items-center justify-center text-xs">
                                {r.user?.firstName?.[0] || "E"}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-text-primary">
                                  {r.user ? `${r.user.firstName} ${r.user.lastName}` : "Employee"}
                                </span>
                                <span className="text-[10px] text-text-tertiary font-mono">
                                  {r.user?.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Leave Type & Session */}
                          <td className="py-3 px-6">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-brand" />
                                <span className="font-semibold text-text-primary">
                                  {r.leaveType?.name || "Annual Leave"}
                                </span>
                              </div>
                              {r.isHalfDay && (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-bold bg-brand/5 text-brand">
                                  Half Day ({r.halfDaySession === "SECOND_HALF" ? "2nd Half" : "1st Half"})
                                </Badge>
                              )}
                              {r.reason && (
                                <div className="text-[11px] text-text-tertiary line-clamp-1">
                                  <RichTextViewer content={r.reason} />
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Dates & Days */}
                          <td className="py-3 px-6">
                            <p className="font-mono text-text-primary text-xs font-semibold">
                              {new Date(r.startDate).toLocaleDateString()} -{" "}
                              {new Date(r.endDate).toLocaleDateString()}
                            </p>
                            <span className="text-[10px] text-text-tertiary font-mono font-bold">
                              {r.days} {r.days === 1 ? "day" : "days"}
                            </span>
                          </td>

                          {/* 3-Level Approval Stepper */}
                          <td className="py-3 px-6">
                            <div className="flex items-center gap-1.5 text-[10px] font-mono">
                              <span
                                title="Team Lead Approval"
                                className={cn(
                                  "px-1.5 py-0.5 rounded font-bold border",
                                  r.tlApprovalStatus === "APPROVED"
                                    ? "bg-success/10 text-success border-success/30"
                                    : r.tlApprovalStatus === "REJECTED"
                                    ? "bg-error/10 text-error border-error/30"
                                    : "bg-surface-subtle text-text-tertiary border-border-base"
                                )}
                              >
                                TL: {r.tlApprovalStatus || "PENDING"}
                              </span>
                              <span
                                title="Project Manager Approval"
                                className={cn(
                                  "px-1.5 py-0.5 rounded font-bold border",
                                  r.pmApprovalStatus === "APPROVED"
                                    ? "bg-success/10 text-success border-success/30"
                                    : r.pmApprovalStatus === "REJECTED"
                                    ? "bg-error/10 text-error border-error/30"
                                    : "bg-surface-subtle text-text-tertiary border-border-base"
                                )}
                              >
                                PM: {r.pmApprovalStatus || "PENDING"}
                              </span>
                              <span
                                title="HR Approval"
                                className={cn(
                                  "px-1.5 py-0.5 rounded font-bold border",
                                  r.hrApprovalStatus === "APPROVED"
                                    ? "bg-success/10 text-success border-success/30"
                                    : r.hrApprovalStatus === "REJECTED"
                                    ? "bg-error/10 text-error border-error/30"
                                    : "bg-surface-subtle text-text-tertiary border-border-base"
                                )}
                              >
                                HR: {r.hrApprovalStatus || "PENDING"}
                              </span>
                            </div>
                          </td>

                          {/* Overall Status Badge */}
                          <td className="py-3 px-6">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider rounded-md",
                                r.status === "PENDING" && "bg-warning/10 text-warning border-warning/30",
                                r.status === "APPROVED" && "bg-success/10 text-success border-success/30",
                                r.status === "REJECTED" && "bg-error/10 text-error border-error/30",
                                r.status === "CANCELLED" && "bg-surface-subtle text-text-tertiary"
                              )}
                            >
                              {r.status}
                            </Badge>
                          </td>

                          {/* Actions (Approve/Reject + HR Edit + Timeline) */}
                          <td className="py-3 px-6 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* View Approval Timeline Trigger */}
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => openTimelineModal(r)}
                                className="h-7 w-7 p-0 text-text-tertiary hover:text-brand cursor-pointer"
                                title="View Approval Timeline"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>

                              {/* HR Only Edit Trigger */}
                              {isHr && (
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  onClick={() => setEditingRequest(r)}
                                  className="h-7 w-7 p-0 text-text-tertiary hover:text-brand cursor-pointer"
                                  title="HR Edit Leave Request"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              )}

                              {r.status === "PENDING" && canApprove ? (
                                <>
                                  <Button
                                    size="xs"
                                    onClick={() => handleApproveStage(r.id, isHr ? "HR" : "TL")}
                                    className="h-7 w-7 p-0 bg-success/10 text-success hover:bg-success hover:text-white rounded transition-colors cursor-pointer"
                                    title="Approve Stage"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="xs"
                                    onClick={() => openRejectModal(r)}
                                    className="h-7 w-7 p-0 bg-error/10 text-error hover:bg-error hover:text-white rounded transition-colors cursor-pointer"
                                    title="Reject Request"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : r.status === "PENDING" ? (
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => openCancelModal(r)}
                                  className="text-error hover:bg-error/10 text-xs cursor-pointer"
                                >
                                  Cancel
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : activeTab === "calendar" ? (
              /* Leave Calendar View */
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm font-heading text-text-primary">{monthName} Leave Schedule</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrevMonth} className="h-8">
                      <ChevronLeft className="h-4 w-4" /> Prev
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleNextMonth} className="h-8">
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-xs">
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const dateObj = new Date(currentYear, currentMonth, day);
                    const dayLeaves = requests.filter((r) => {
                      const start = new Date(r.startDate);
                      const end = new Date(r.endDate);
                      const norm = new Date(currentYear, currentMonth, day);
                      return norm >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
                        norm <= new Date(end.getFullYear(), end.getMonth(), end.getDate()) &&
                        r.status === "APPROVED";
                    });

                    return (
                      <div
                        key={day}
                        onClick={() => setSelectedCalendarDate(dateObj)}
                        className={cn(
                          "p-3 rounded-lg border border-border-base bg-surface hover:border-brand/40 transition-all cursor-pointer flex flex-col items-center gap-1 min-h-[70px]",
                          dayLeaves.length > 0 && "bg-brand/5 border-brand/20"
                        )}
                      >
                        <span className="font-mono font-bold text-xs text-text-primary">{day}</span>
                        {dayLeaves.length > 0 && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 bg-brand text-white font-bold">
                            {dayLeaves.length} Out
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Leave Types & Policies Tab */
              <div className="p-6 space-y-5 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm font-heading text-text-primary">
                      Enterprise Leave Types & Quotas
                    </h3>
                    <p className="text-[11px] text-text-tertiary mt-0.5">
                      Configured leave categories, annual day allowances, and pay statuses.
                    </p>
                  </div>
                  {isHr && (
                    <Button
                      size="sm"
                      onClick={() => setCreateTypeModal(true)}
                      className="bg-brand hover:bg-brand/90 text-white font-semibold text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Leave Type
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {leaveTypes.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-xl border border-border-base bg-surface-subtle/30 space-y-1.5 hover:border-brand/30 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text-primary text-xs">{t.name}</span>
                          <span className="font-mono text-[10px] text-text-tertiary bg-surface px-1.5 py-0.5 rounded border border-border-base">
                            {t.code}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-bold px-2 py-0.5",
                            t.isPaid ? "bg-success/10 text-success border-success/30" : "bg-warning/10 text-warning border-warning/30"
                          )}
                        >
                          {t.isPaid ? "PAID" : "UNPAID"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-text-tertiary pt-1 border-t border-border-base/50">
                        <span>
                          Annual Quota: <strong className="text-text-primary">{t.maxDaysPerYear ? `${t.maxDaysPerYear} days` : "Unlimited"}</strong>
                        </span>
                        {isHr && (
                          <button
                            type="button"
                            onClick={() => openDeleteTypeModal(t)}
                            className="text-text-tertiary hover:text-error transition-colors text-[10px] font-semibold cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (30% - lg:col-span-4) */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Team Calendar Mini with Interactive Date Click */}
          <Card className="p-4 border border-border-base bg-surface rounded-xl shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-border-base pb-2">
              <h3 className="font-bold text-xs font-heading text-text-primary uppercase tracking-wider">
                Team Calendar
              </h3>
              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-surface-subtle rounded text-text-tertiary cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="font-semibold text-text-primary">{monthName}</span>
                <button
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-surface-subtle rounded text-text-tertiary cursor-pointer"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Calendar Day Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-text-tertiary">
              <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dateObj = new Date(currentYear, currentMonth, day);
                const hasLeave = requests.some((r) => {
                  const start = new Date(r.startDate);
                  const end = new Date(r.endDate);
                  const norm = new Date(currentYear, currentMonth, day);
                  return norm >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
                    norm <= new Date(end.getFullYear(), end.getMonth(), end.getDate()) &&
                    r.status === "APPROVED";
                });

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedCalendarDate(dateObj)}
                    className={cn(
                      "py-1.5 rounded text-[11px] font-semibold relative cursor-pointer hover:bg-surface-subtle/60 transition-colors",
                      hasLeave && "bg-brand/10 text-brand font-bold border border-brand/30"
                    )}
                  >
                    {day}
                    {hasLeave && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border-base flex gap-3 text-[10px] font-semibold text-text-tertiary justify-center">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand" /> Annual</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-info" /> Sick</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> Pending</span>
            </div>
          </Card>

          {/* Who's Out Widget */}
          <Card className="p-4 border border-border-base bg-surface rounded-xl shadow-2xs space-y-3">
            <h3 className="font-bold text-xs font-heading text-text-primary uppercase tracking-wider border-b border-border-base pb-2">
              Who's Out
            </h3>

            {/* Today */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
                Today
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface-subtle/30">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-brand/10 text-brand font-bold flex items-center justify-center text-[10px]">
                      A
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">Ananya Patel</p>
                      <p className="text-[10px] text-text-tertiary">Sick Leave</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px]">Full Day</Badge>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-surface-subtle/30">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-info/10 text-info font-bold flex items-center justify-center text-[10px]">
                      V
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">Vikram Singh</p>
                      <p className="text-[10px] text-text-tertiary">Annual Leave</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px]">Half Day (1st Half)</Badge>
                </div>
              </div>
            </div>

            {/* Tomorrow */}
            <div className="space-y-2 pt-2 border-t border-border-base/50">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
                Tomorrow
              </span>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-subtle/30 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-warning/10 text-warning font-bold flex items-center justify-center text-[10px]">
                    R
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">Rohit Verma</p>
                    <p className="text-[10px] text-text-tertiary">Bereavement Leave</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px]">Full Day</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Apply Leave Sheet Drawer */}
      <ApplyLeaveSheet
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        onSuccess={() => loadData()}
        leaveTypes={leaveTypes}
        isHr={isHr}
      />

      {/* Edit Leave Sheet Drawer (HR Only) */}
      <EditLeaveSheet
        request={editingRequest}
        onClose={() => setEditingRequest(null)}
        onSuccess={() => loadData()}
        leaveTypes={leaveTypes}
      />

      {/* Calendar Day Click Preview Dialog */}
      <CalendarDayDialog
        isOpen={Boolean(selectedCalendarDate)}
        onClose={() => setSelectedCalendarDate(null)}
        selectedDate={selectedCalendarDate}
        leaveRequests={requests}
      />

      {/* Confirmation Modal with Acknowledgement Checkbox */}
      <Dialog
        open={confirmModal.isOpen}
        onOpenChange={(open) => !open && setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      >
        <DialogContent className="sm:max-w-md bg-surface p-6">
          <DialogHeader className="pb-3 border-b border-border-base">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-error/10 text-error flex items-center justify-center font-bold">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="font-heading text-base font-bold text-text-primary">
                  {confirmModal.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-text-tertiary">
                  Please review the action details and confirm below.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-3">
            <p className="text-xs text-text-secondary leading-relaxed bg-surface-subtle/50 p-3 rounded-lg border border-border-base">
              {confirmModal.description}
            </p>

            {/* Optional / Required Reason Input (for Rejection) */}
            {confirmModal.type === "reject" && (
              <div className="space-y-1.5">
                <label className="font-semibold text-xs text-text-primary">
                  {confirmModal.extraLabel || "Reason for Rejection*"}
                </label>
                <textarea
                  className="w-full h-20 p-2.5 rounded-lg border border-border-base bg-surface text-text-primary text-xs focus:border-error focus:outline-none resize-none"
                  placeholder="Explain why this request is being rejected (e.g. insufficient coverage, project deadline)..."
                  value={confirmReason}
                  onChange={(e) => setConfirmReason(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Mandatory Acknowledgement Checkbox */}
            <div className="p-3 rounded-lg border border-border-base bg-surface-subtle/40 flex items-start gap-3">
              <input
                id="ack-confirm-check"
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border-base text-brand focus:ring-brand accent-brand cursor-pointer"
              />
              <label
                htmlFor="ack-confirm-check"
                className="text-xs font-medium text-text-primary leading-tight cursor-pointer select-none"
              >
                I confirm that I have reviewed this action and understand that it will update records immediately.
              </label>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border-base flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
              disabled={modalLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!acknowledged || modalLoading}
              onClick={handleConfirmModalSubmit}
              className="bg-error hover:bg-error/90 text-white font-bold"
            >
              {modalLoading ? "Processing..." : "Confirm Action"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Leave Type Modal */}
      <Dialog open={createTypeModal} onOpenChange={(open) => !open && setCreateTypeModal(false)}>
        <DialogContent className="sm:max-w-md bg-surface p-6">
          <DialogHeader className="pb-3 border-b border-border-base">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold">
                <Plus className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="font-heading text-base font-bold text-text-primary">
                  Create Leave Type
                </DialogTitle>
                <DialogDescription className="text-xs text-text-tertiary">
                  Define a new category and yearly allowance for time off.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateLeaveType} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-xs text-text-primary">Leave Name*</label>
              <input
                type="text"
                placeholder="e.g. Marriage Leave / Sabbatical"
                value={typeForm.name}
                onChange={(e) => setTypeForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-border-base bg-surface text-text-primary text-xs focus:border-brand focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-xs text-text-primary">Code*</label>
                <input
                  type="text"
                  placeholder="e.g. ML"
                  value={typeForm.code}
                  onChange={(e) => setTypeForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full h-9 px-3 rounded-lg border border-border-base bg-surface text-text-primary text-xs font-mono focus:border-brand focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-xs text-text-primary">Max Days / Year</label>
                <input
                  type="number"
                  placeholder="e.g. 15 (leave empty for unlimited)"
                  value={typeForm.maxDaysPerYear}
                  onChange={(e) => setTypeForm((prev) => ({ ...prev, maxDaysPerYear: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-border-base bg-surface text-text-primary text-xs focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border-base bg-surface-subtle/40 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-bold text-xs text-text-primary">Paid Leave</span>
                <p className="text-[11px] text-text-tertiary">Employees are compensated for these days.</p>
              </div>
              <input
                type="checkbox"
                checked={typeForm.isPaid}
                onChange={(e) => setTypeForm((prev) => ({ ...prev, isPaid: e.target.checked }))}
                className="h-4 w-4 rounded border-border-base text-brand focus:ring-brand accent-brand cursor-pointer"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border-base flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateTypeModal(false)}
                disabled={modalLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={modalLoading}
                className="bg-brand hover:bg-brand/90 text-white font-bold"
              >
                {modalLoading ? "Creating..." : "Create Leave Type"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Leave Approval Timeline Modal */}
      <Dialog open={Boolean(timelineRequest)} onOpenChange={(open) => !open && setTimelineRequest(null)}>
        <DialogContent className="sm:max-w-lg bg-surface p-6">
          <DialogHeader className="pb-4 border-b border-border-base">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="font-heading text-base font-bold text-text-primary">
                  Leave Approval Timeline
                </DialogTitle>
                <DialogDescription className="text-xs text-text-tertiary">
                  Multi-level review audit trail & stage approval history
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {timelineRequest && (
            <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-1">
              {/* Summary Card */}
              <div className="p-3.5 rounded-xl border border-border-base bg-surface-subtle/50 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-xs text-text-primary">
                      {timelineRequest.user?.firstName} {timelineRequest.user?.lastName}
                    </p>
                    <p className="text-[11px] text-text-tertiary font-mono">{timelineRequest.user?.email}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 uppercase",
                      timelineRequest.status === "PENDING" && "bg-warning/10 text-warning border-warning/30",
                      timelineRequest.status === "APPROVED" && "bg-success/10 text-success border-success/30",
                      timelineRequest.status === "REJECTED" && "bg-error/10 text-error border-error/30",
                      timelineRequest.status === "CANCELLED" && "bg-surface text-text-tertiary"
                    )}
                  >
                    {timelineRequest.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border-base/50">
                  <div>
                    <span className="text-[10px] text-text-tertiary uppercase font-bold block">Type</span>
                    <span className="font-semibold text-text-primary">
                      {timelineRequest.leaveType?.name || "Leave"} ({timelineRequest.days} {timelineRequest.days === 1 ? "day" : "days"})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-tertiary uppercase font-bold block">Dates</span>
                    <span className="font-semibold text-text-primary font-mono text-[11px]">
                      {new Date(timelineRequest.startDate).toLocaleDateString()} - {new Date(timelineRequest.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {timelineRequest.reason && (
                  <div className="pt-2 border-t border-border-base/50">
                    <span className="text-[10px] text-text-tertiary uppercase font-bold block">Reason / Notes</span>
                    <div className="text-xs text-text-secondary mt-0.5">
                      <RichTextViewer content={timelineRequest.reason} />
                    </div>
                  </div>
                )}
              </div>

              {/* 3-Level Progress Indicator */}
              <div className="p-3 rounded-xl border border-border-base bg-surface">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-2">
                  Approval Gates
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className={cn(
                    "p-2 rounded-lg border",
                    timelineRequest.tlApprovalStatus === "APPROVED" ? "bg-success/10 text-success border-success/30" :
                    timelineRequest.tlApprovalStatus === "REJECTED" ? "bg-error/10 text-error border-error/30" :
                    "bg-surface-subtle text-text-tertiary border-border-base"
                  )}>
                    <span className="font-bold block text-[10px]">Team Lead</span>
                    <span className="text-[9px]">{timelineRequest.tlApprovalStatus || "PENDING"}</span>
                  </div>
                  <div className={cn(
                    "p-2 rounded-lg border",
                    timelineRequest.pmApprovalStatus === "APPROVED" ? "bg-success/10 text-success border-success/30" :
                    timelineRequest.pmApprovalStatus === "REJECTED" ? "bg-error/10 text-error border-error/30" :
                    "bg-surface-subtle text-text-tertiary border-border-base"
                  )}>
                    <span className="font-bold block text-[10px]">Project Manager</span>
                    <span className="text-[9px]">{timelineRequest.pmApprovalStatus || "PENDING"}</span>
                  </div>
                  <div className={cn(
                    "p-2 rounded-lg border",
                    timelineRequest.hrApprovalStatus === "APPROVED" ? "bg-success/10 text-success border-success/30" :
                    timelineRequest.hrApprovalStatus === "REJECTED" ? "bg-error/10 text-error border-error/30" :
                    "bg-surface-subtle text-text-tertiary border-border-base"
                  )}>
                    <span className="font-bold block text-[10px]">HR Admin</span>
                    <span className="text-[9px]">{timelineRequest.hrApprovalStatus || "PENDING"}</span>
                  </div>
                </div>
              </div>

              {/* Approval Timeline Logs */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
                  Audit Activity Log
                </span>
                <ApprovalTimeline logs={timelineLogs} loading={loadingTimelineLogs} />
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-border-base">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTimelineRequest(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}