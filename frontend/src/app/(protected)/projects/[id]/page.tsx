"use client";

import { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { usePermission } from "@/providers/auth-provider";
import { motion, AnimatePresence } from "framer-motion";
import {
  api,
  type ProjectDetail,
  type Task,
  type TaskStatus,
  type User,
  type Milestone,
  type ProjectMemberRow,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TaskDetailSheet } from "@/components/projects/TaskDetailSheet";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Clock,
  DollarSign,
  FolderKanban,
  LayoutGrid,
  List,
  Plus,
  Star,
  Users,
  Building2,
  Activity,
  Flag,
  MoreHorizontal,
  CheckSquare,
  Search,
  Filter,
  UserCheck,
  Trash2,
  Minimize2,
  Maximize2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const KANBAN_COLUMNS: Array<{ id: TaskStatus; title: string; color: string }> = [
  { id: "BACKLOG", title: "Backlog", color: "border-t-secondary-fixed-dim" },
  { id: "TODO", title: "To Do", color: "border-t-info" },
  { id: "IN_PROGRESS", title: "In Progress", color: "border-t-brand" },
  { id: "DONE", title: "Done", color: "border-t-success" },
];

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const userPerms = usePermission("user");
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [taskSearch, setTaskSearch] = useState("");

  // Minimize / Maximize Sidebar States
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // Quick Task Creation
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addingTaskCol, setAddingTaskCol] = useState<TaskStatus | null>(null);

  // Add Member State
  const [addMemberUserId, setAddMemberUserId] = useState("");
  const [addMemberRole, setAddMemberRole] = useState("MEMBER");
  const [addingMember, setAddingMember] = useState(false);

  // Drag and Drop States
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [draggingOverCol, setDraggingOverCol] = useState<TaskStatus | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.getProject(projectId);
      setProjectDetail(res.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load project details");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Load users for the add-member selector — best-effort and non-blocking so a
  // missing user:read permission doesn't prevent viewing the project.
  useEffect(() => {
    if (!userPerms.read) return;
    const loadUsers = async () => {
      try {
        const usersRes = await api.listUsers(1, 100);
        setUsers(usersRes.data);
      } catch {
        /* secondary lookup is optional */
      }
    };
    loadUsers();
  }, [projectId, userPerms.read]);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time Add Member Handler (Optimistic + Server Sync)
  async function handleAddMember() {
    if (!addMemberUserId || !projectDetail) return;
    setAddingMember(true);

    const targetUser = users.find((u) => u.id === addMemberUserId);
    if (!targetUser) return;

    const newMemberRow: ProjectMemberRow = {
      id: `temp-${Date.now()}`,
      roleInProject: addMemberRole,
      joinedAt: new Date().toISOString(),
      user: {
        id: targetUser.id,
        firstName: targetUser.firstName || "",
        lastName: targetUser.lastName || "",
        email: targetUser.email,
        avatarUrl: targetUser.avatarUrl,
        designation: targetUser.designation,
      },
    };

    // Optimistic Update
    setProjectDetail((prev) =>
      prev
        ? {
            ...prev,
            members: [...(prev.members || []), newMemberRow],
            _count: {
              ...prev._count,
              members: (prev._count?.members || prev.members?.length || 0) + 1,
            },
          }
        : prev
    );

    try {
      await api.addProjectMember(projectId, {
        userId: addMemberUserId,
        roleInProject: addMemberRole,
      });
      toast.success(`${targetUser.firstName} ${targetUser.lastName} added to project`);
      setAddMemberUserId("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add member");
      load();
    } finally {
      setAddingMember(false);
    }
  }

  // Real-time Remove Member Handler
  async function handleRemoveMember(userId: string) {
    if (!projectDetail) return;
    if (!window.confirm("Remove this member from the project?")) return;

    setProjectDetail((prev) =>
      prev
        ? {
            ...prev,
            members: (prev.members || []).filter((m) => m.user.id !== userId),
            _count: {
              ...prev._count,
              members: Math.max(0, (prev._count?.members || prev.members?.length || 1) - 1),
            },
          }
        : prev
    );

    try {
      await api.removeProjectMember(projectId, userId);
      toast.success("Member removed from project");
      load();
    } catch (err) {
      toast.error("Failed to remove member");
      load();
    }
  }

  async function handleTaskStatusMove(taskId: string, targetStatus: TaskStatus) {
    if (!projectDetail) return;

    setProjectDetail((prev) =>
      prev
        ? {
            ...prev,
            tasks: (prev.tasks || []).map((t) =>
              t.id === taskId ? { ...t, status: targetStatus, isCompleted: targetStatus === "DONE" } : t
            ),
          }
        : prev
    );

    try {
      await api.updateTaskStatus(taskId, targetStatus);
      toast.success(`Task moved to ${targetStatus.replace("_", " ")}`);
      load();
    } catch (err) {
      toast.error("Failed to move task");
      load();
    }
  }

  async function handleQuickCreateTask(status: TaskStatus) {
    if (!newTaskTitle.trim()) return;
    try {
      await api.createTask(projectId, {
        title: newTaskTitle,
        status,
      });
      setNewTaskTitle("");
      setAddingTaskCol(null);
      toast.success("Task created");
      load();
    } catch (err) {
      toast.error("Failed to create task");
    }
  }

  if (loading || !projectDetail) {
    return (
      <div className="p-12 text-center text-xs text-text-tertiary flex flex-col items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent mb-3" />
        <p className="font-semibold">Loading project workspace...</p>
      </div>
    );
  }

  const tasks = (projectDetail.tasks || []).filter(
    (t) => !taskSearch || t.title.toLowerCase().includes(taskSearch.toLowerCase())
  );
  const milestones = projectDetail.milestones || [];
  const activities = projectDetail.activities || [];
  const members = projectDetail.members || [];
  const pm = projectDetail.projectManager;

  // Calculate dynamic grid column spans based on collapse state
  const centerColSpan =
    isLeftCollapsed && isRightCollapsed
      ? "col-span-12 lg:col-span-10"
      : isLeftCollapsed || isRightCollapsed
      ? "col-span-12 lg:col-span-8"
      : "col-span-12 lg:col-span-6";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 flex flex-col min-h-[calc(100vh-100px)]"
    >
      {/* Top Context Header */}
      <motion.div
        layout
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-4 rounded-xl border border-border-base shadow-2xs"
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" asChild className="h-8 w-8">
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center font-bold shadow-2xs">
            <FolderKanban className="h-5 w-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-lg font-bold text-text-primary">{projectDetail.name}</h1>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-subtle text-text-tertiary font-bold">
                {projectDetail.code || "PROJ"}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand/10 text-brand">
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                {projectDetail.status}
              </span>
            </div>
            <p className="text-xs text-text-tertiary mt-0.5">
              {projectDetail.department?.name || "General"} · Created by {projectDetail.createdBy?.firstName || "Admin"}
            </p>
          </div>
        </div>

        {/* Action Controls & Layout Toggles */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Member Avatars Stack */}
          <div className="hidden md:flex -space-x-2 mr-2">
            {members.slice(0, 4).map((m) => (
              <div
                key={m.id}
                className="w-7 h-7 rounded-full bg-brand/10 border-2 border-surface flex items-center justify-center text-[10px] font-bold text-brand font-mono"
                title={`${m.user.firstName} ${m.user.lastName}`}
              >
                {m.user.firstName?.[0] || "U"}
              </div>
            ))}
            {members.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-surface-subtle border-2 border-surface flex items-center justify-center text-[9px] font-bold text-text-tertiary font-mono">
                +{members.length - 4}
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-md border border-border-base bg-surface p-0.5">
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all",
                viewMode === "kanban" ? "bg-brand text-white shadow-2xs" : "text-text-tertiary hover:text-text-primary"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Board
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all",
                viewMode === "list" ? "bg-brand text-white shadow-2xs" : "text-text-tertiary hover:text-text-primary"
              )}
            >
              <List className="h-3.5 w-3.5" /> List
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Workspace Triple Zone Layout with Framer Motion Animation */}
      <div className="grid grid-cols-12 gap-4 flex-1">
        {/* LEFT ZONE: Project Meta & Realtime Members List */}
        <motion.div
          layout
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "col-span-12 transition-all duration-300",
            isLeftCollapsed ? "lg:col-span-1" : "lg:col-span-3"
          )}
        >
          {isLeftCollapsed ? (
            /* Minimized Left Rail */
            <Card className="p-3 border border-border-base bg-surface rounded-xl shadow-2xs flex flex-col items-center gap-4 h-full">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsLeftCollapsed(false)}
                title="Expand Project Info"
                className="text-text-tertiary hover:text-brand hover:bg-surface-subtle"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>

              <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-bold font-mono text-xs">
                {projectDetail.code || "PRJ"}
              </div>

              <div className="flex flex-col items-center gap-2 mt-auto text-text-tertiary text-xs">
                <Users className="h-4 w-4 text-brand" />
                <span className="font-mono font-bold text-[11px]">{members.length}</span>
              </div>
            </Card>
          ) : (
            /* Full Left Sidebar Panel */
            <div className="space-y-4">
              {/* Header & Meta Card */}
              <Card className="p-4 border border-border-base bg-surface space-y-4 rounded-xl shadow-2xs relative">
                <div className="flex items-center justify-between border-b border-border-base/50 pb-2">
                  <h3 className="font-bold text-xs font-heading text-text-primary uppercase tracking-wider">
                    Project Information
                  </h3>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setIsLeftCollapsed(true)}
                      title="Minimize Sidebar"
                      className="h-6 w-6 text-text-tertiary hover:text-brand"
                    >
                      <PanelLeftClose className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-text-tertiary leading-relaxed">
                  {projectDetail.description || "No project overview description provided."}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2 rounded-lg bg-surface-subtle/40 border border-border-base/50 space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-text-tertiary block">Owner / PM</span>
                    <span className="font-semibold text-text-primary block truncate">
                      {pm ? `${pm.firstName} ${pm.lastName}` : "Unassigned"}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-subtle/40 border border-border-base/50 space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-text-tertiary block">Priority</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-bold uppercase">
                      {projectDetail.priority || "MEDIUM"}
                    </Badge>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-subtle/40 border border-border-base/50 space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-text-tertiary block">Budget</span>
                    <span className="font-mono font-bold text-text-primary block">${projectDetail.budget || 0}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-subtle/40 border border-border-base/50 space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-text-tertiary block">Billable</span>
                    <span className="font-semibold text-success text-[11px]">
                      {projectDetail.isBillable ? "Yes" : "No"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border-base/50 space-y-1 text-xs">
                  <div className="flex justify-between items-center text-text-tertiary text-[11px]">
                    <span>Overall Progress</span>
                    <span className="font-mono font-bold text-text-primary">{projectDetail.progress}%</span>
                  </div>
                  <div className="w-full bg-surface-subtle rounded-full h-2 overflow-hidden">
                    <div className="bg-brand h-2 rounded-full transition-all duration-500" style={{ width: `${projectDetail.progress || 0}%` }} />
                  </div>
                </div>
              </Card>

              {/* Members Roster Card with Realtime Updates */}
              <Card className="p-4 border border-border-base bg-surface space-y-3 rounded-xl shadow-2xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs font-heading text-text-primary uppercase tracking-wider">
                    Members ({members.length})
                  </h3>
                  <span className="text-[10px] text-brand font-semibold font-mono">Live Sync</span>
                </div>

                {/* Add Member Controls Grouped by Team */}
                <div className="flex gap-1.5">
                  <select
                    className="h-8 flex-1 rounded-md border border-border-base bg-surface px-2 text-xs focus:border-brand focus:outline-none"
                    value={addMemberUserId}
                    onChange={(e) => setAddMemberUserId(e.target.value)}
                  >
                    <option value="">Select Employee to add...</option>
                    {Object.entries(
                      users
                        .filter((u) => !members.some((m) => m.user.id === u.id))
                        .reduce((groups, u) => {
                          const key = u.department?.name || u.designation || "General Team";
                          if (!groups[key]) groups[key] = [];
                          groups[key].push(u);
                          return groups;
                        }, {} as Record<string, typeof users>)
                    ).map(([groupName, groupUsers]) => (
                      <optgroup key={groupName} label={`── ${groupName} ──`}>
                        {groupUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.firstName} {u.lastName} ({u.designation || u.email})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    onClick={handleAddMember}
                    disabled={!addMemberUserId || addingMember}
                    className="h-8 text-xs bg-brand hover:bg-brand-hover text-white px-3 font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Member List */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {members.length === 0 ? (
                    <p className="text-xs text-text-tertiary">No members added yet.</p>
                  ) : (
                    members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-subtle/50 border border-border-base/40 text-xs group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-brand/10 text-brand font-mono font-bold flex items-center justify-center text-[11px] shrink-0">
                            {m.user.firstName?.[0] || "U"}
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary leading-tight">
                              {m.user.firstName} {m.user.lastName}
                            </p>
                            <p className="text-[10px] text-text-tertiary font-mono">
                              {m.roleInProject || "Member"}
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleRemoveMember(m.user.id)}
                          className="text-text-tertiary hover:text-error h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          )}
        </motion.div>

        {/* CENTER ZONE: Kanban Board (Expands dynamically up to 83% width when sidebars collapse!) */}
        <motion.div
          layout
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn("col-span-12 space-y-4 flex flex-col transition-all duration-300", centerColSpan)}
        >
          {/* Search & Quick Filter Bar */}
          <div className="flex items-center justify-between gap-3 bg-surface p-2.5 rounded-xl border border-border-base shadow-2xs">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
              <input
                className="w-full h-8 pl-8 pr-3 bg-surface-subtle/40 rounded-lg border border-border-base text-xs focus:border-brand focus:outline-none"
                placeholder="Search board tasks..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Filter className="h-3.5 w-3.5 text-text-tertiary" /> Filter
            </Button>
          </div>

          {viewMode === "kanban" ? (
            /* Kanban Grid */
            <div
              className={cn(
                "grid gap-3 flex-1",
                isLeftCollapsed && isRightCollapsed
                  ? "grid-cols-1 md:grid-cols-4"
                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
              )}
            >
              {KANBAN_COLUMNS.map((col) => {
                const colTasks = tasks.filter((t) => t.status === col.id);

                return (
                  <div
                    key={col.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (draggingOverCol !== col.id) setDraggingOverCol(col.id);
                    }}
                    onDragLeave={() => setDraggingOverCol(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDraggingOverCol(null);
                      const taskId = e.dataTransfer.getData("text/plain");
                      if (taskId) handleTaskStatusMove(taskId, col.id);
                    }}
                    className={cn(
                      "rounded-xl border border-border-base bg-surface p-3 flex flex-col space-y-3 border-t-4 shadow-2xs transition-all",
                      col.color,
                      draggingOverCol === col.id && "ring-2 ring-brand bg-brand/5 border-brand/40"
                    )}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-text-primary font-heading">{col.title}</span>
                        <span className="text-[10px] font-mono font-bold bg-surface-subtle text-text-tertiary px-1.5 py-0.5 rounded">
                          {colTasks.length}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setAddingTaskCol(addingTaskCol === col.id ? null : col.id)}
                        className="h-6 w-6 text-text-tertiary hover:text-brand"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Quick Task Addition Box */}
                    {addingTaskCol === col.id && (
                      <div className="p-2 border border-brand/40 rounded-lg bg-surface-subtle/40 space-y-2">
                        <input
                          autoFocus
                          className="w-full text-xs bg-surface border border-border-base rounded px-2 py-1 focus:outline-none focus:border-brand"
                          placeholder="Task title..."
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleQuickCreateTask(col.id);
                          }}
                        />
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="xs" onClick={() => setAddingTaskCol(null)}>Cancel</Button>
                          <Button size="xs" onClick={() => handleQuickCreateTask(col.id)} className="bg-brand text-white font-bold">Add Task</Button>
                        </div>
                      </div>
                    )}

                    {/* Task Cards */}
                    <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[520px] pr-1">
                      <AnimatePresence>
                        {colTasks.map((t) => (
                          <div
                            key={t.id}
                            draggable
                            onDragStart={(e: React.DragEvent) => {
                              e.dataTransfer.setData("text/plain", t.id);
                              e.dataTransfer.effectAllowed = "move";
                              setDraggedTaskId(t.id);
                            }}
                            onDragEnd={() => {
                              setDraggedTaskId(null);
                              setDraggingOverCol(null);
                            }}
                            onClick={() => setSelectedTask(t)}
                            className={cn(
                              "p-3 rounded-lg border border-border-base bg-surface shadow-2xs hover:border-brand/40 transition-all cursor-grab active:cursor-grabbing space-y-2 group relative overflow-hidden",
                              draggedTaskId === t.id && "opacity-40 ring-2 ring-brand"
                            )}
                          >
                            <div className="absolute top-0 left-0 w-1 h-full bg-brand/60" />

                            <div className="flex items-start justify-between pl-1">
                              <span className="text-[10px] font-mono font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded">
                                {t.taskCode || "TASK"}
                              </span>
                              <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase font-semibold">
                                {t.priority}
                              </Badge>
                            </div>

                            <h4 className="font-semibold text-xs text-text-primary group-hover:text-brand transition-colors line-clamp-2 pl-1">
                              {t.title}
                            </h4>

                            <div className="flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border-base/40 pl-1">
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 text-[10px]">
                                  <CheckSquare className="h-3 w-3 text-brand" /> {t._count?.comments || 0}
                                </span>
                              </div>

                              {t.assignee ? (
                                <div
                                  className="w-5 h-5 rounded-full bg-brand/10 text-brand font-mono font-bold flex items-center justify-center text-[9px]"
                                  title={`${t.assignee.firstName} ${t.assignee.lastName}`}
                                >
                                  {t.assignee.firstName?.[0]}
                                </div>
                              ) : (
                                <span className="text-[9px] text-text-tertiary font-mono">Unassigned</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Task List Mode */
            <Card className="p-4 border border-border-base bg-surface space-y-3 rounded-xl shadow-2xs">
              <h3 className="font-bold text-xs font-heading text-text-primary uppercase tracking-wider">All Project Tasks</h3>
              <div className="space-y-2">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTask(t)}
                    className="flex items-center justify-between p-3 rounded-lg border border-border-base hover:border-brand/40 transition-colors cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-brand bg-brand/10 px-2 py-0.5 rounded text-[10px]">
                        {t.taskCode || "TASK"}
                      </span>
                      <span className="font-semibold text-text-primary">{t.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[10px]">
                        {t.status}
                      </Badge>
                      <span className="text-text-tertiary text-[11px]">{t.assignee ? `${t.assignee.firstName}` : "Unassigned"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </motion.div>

        {/* RIGHT ZONE: Milestones & Activity Log (Collapsible) */}
        <motion.div
          layout
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "col-span-12 transition-all duration-300",
            isRightCollapsed ? "lg:col-span-1" : "lg:col-span-3"
          )}
        >
          {isRightCollapsed ? (
            /* Minimized Right Rail */
            <Card className="p-3 border border-border-base bg-surface rounded-xl shadow-2xs flex flex-col items-center gap-4 h-full">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsRightCollapsed(false)}
                title="Expand Milestones & Activity"
                className="text-text-tertiary hover:text-brand hover:bg-surface-subtle"
              >
                <PanelRightOpen className="h-4 w-4" />
              </Button>

              <div className="flex flex-col items-center gap-1 text-text-tertiary text-xs">
                <Flag className="h-4 w-4 text-brand" />
                <span className="font-mono font-bold text-[10px]">{milestones.length}</span>
              </div>

              <div className="flex flex-col items-center gap-1 text-text-tertiary text-xs mt-auto">
                <Activity className="h-4 w-4 text-brand" />
                <span className="font-mono font-bold text-[10px]">{activities.length}</span>
              </div>
            </Card>
          ) : (
            /* Full Right Sidebar Panel */
            <div className="space-y-4">
              {/* Milestones Vertical Timeline Card */}
              <Card className="p-4 border border-border-base bg-surface space-y-3 rounded-xl shadow-2xs">
                <div className="flex items-center justify-between border-b border-border-base/50 pb-2">
                  <h3 className="font-bold text-xs font-heading text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Flag className="h-3.5 w-3.5 text-brand" /> Milestones ({milestones.length})
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setIsRightCollapsed(true)}
                    title="Minimize Sidebar"
                    className="h-6 w-6 text-text-tertiary hover:text-brand"
                  >
                    <PanelRightClose className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-border-base">
                  {milestones.length === 0 ? (
                    <p className="text-xs text-text-tertiary">No milestones set.</p>
                  ) : (
                    milestones.map((ms) => (
                      <div key={ms.id} className="relative space-y-0.5 text-xs">
                        <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-brand ring-4 ring-surface" />
                        <p className="font-bold text-text-primary">{ms.title}</p>
                        <p className="text-[11px] text-text-tertiary">{ms.description || "No description"}</p>
                        <span className="inline-block text-[10px] font-mono font-semibold text-brand">
                          {ms.dueDate ? new Date(ms.dueDate).toLocaleDateString() : "No Date"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Project Activity Log Stream */}
              <Card className="p-4 border border-border-base bg-surface space-y-3 rounded-xl shadow-2xs">
                <h3 className="font-bold text-xs font-heading text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-brand" /> Activity Feed
                </h3>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1 text-xs">
                  {activities.length === 0 ? (
                    <p className="text-xs text-text-tertiary">No activity recorded yet.</p>
                  ) : (
                    activities.map((a) => (
                      <div key={a.id} className="p-2 rounded-lg bg-surface-subtle/30 space-y-0.5">
                        <p className="font-semibold text-text-primary text-[11px]">{a.action}</p>
                        <p className="text-[10px] text-text-tertiary">
                          {a.user ? `${a.user.firstName} ${a.user.lastName}` : "System"} · {new Date(a.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          )}
        </motion.div>
      </div>

      {/* Task Detail Sheet Drawer */}
      {selectedTask && (
        <TaskDetailSheet
          task={selectedTask}
          users={users}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={() => {
            load();
          }}
        />
      )}
    </motion.div>
  );
}
