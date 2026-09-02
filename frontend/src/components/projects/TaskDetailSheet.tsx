"use client";

import { useEffect, useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api, type Task, type TaskStatus, type TaskPriority, type TaskComment, type User } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor, RichTextViewer } from "@/components/ui/rich-text-editor";
import {
  Calendar,
  CheckSquare,
  Clock,
  Flag,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Send,
  Star,
  UserCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskDetailSheetProps {
  task: Task;
  users: User[];
  onClose: () => void;
  onTaskUpdated: () => void;
}

export function TaskDetailSheet({
  task,
  users,
  onClose,
  onTaskUpdated,
}: TaskDetailSheetProps) {
  const [currentTask, setCurrentTask] = useState<Task>(task);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);

  useEffect(() => {
    setCurrentTask(task);
    loadComments();
  }, [task]);

  async function loadComments() {
    try {
      const res = await api.getTaskComments(task.id);
      setComments(res.data);
    } catch (err) {
      // fallback
    }
  }

  async function handleStatusChange(status: TaskStatus) {
    try {
      await api.updateTaskStatus(task.id, status);
      setCurrentTask({ ...currentTask, status });
      toast.success(`Task status updated to ${status}`);
      onTaskUpdated();
    } catch (err) {
      toast.error("Failed to update status");
    }
  }

  async function handlePriorityChange(priority: TaskPriority) {
    try {
      await api.updateTask(task.id, { priority });
      setCurrentTask({ ...currentTask, priority });
      toast.success(`Task priority updated to ${priority}`);
      onTaskUpdated();
    } catch (err) {
      toast.error("Failed to update priority");
    }
  }

  async function handleAssigneeChange(assigneeId: string) {
    try {
      await api.updateTask(task.id, { assigneeId });
      const targetUser = users.find((u) => u.id === assigneeId);
      setCurrentTask({
        ...currentTask,
        assigneeId,
        assignee: targetUser
          ? {
              id: targetUser.id,
              firstName: targetUser.firstName || "",
              lastName: targetUser.lastName || "",
              email: targetUser.email,
              avatarUrl: targetUser.avatarUrl,
              designation: targetUser.designation,
            }
          : null,
      });
      toast.success("Task assignee updated");
      onTaskUpdated();
    } catch (err) {
      toast.error("Failed to update assignee");
    }
  }

  async function handleAddComment(e: FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setAddingComment(true);
    try {
      const res = await api.addComment(task.id, newComment);
      setComments([...comments, res.data]);
      setNewComment("");
      toast.success("Comment added");
    } catch (err) {
      toast.error("Failed to add comment");
    } finally {
      setAddingComment(false);
    }
  }

  async function handleAddSubtask() {
    if (!subtaskTitle.trim()) return;
    setAddingSubtask(true);
    try {
      await api.createTask(task.projectId, {
        title: subtaskTitle,
        parentTaskId: task.id,
      });
      setSubtaskTitle("");
      toast.success("Subtask added");
      onTaskUpdated();
    } catch (err) {
      toast.error("Failed to add subtask");
    } finally {
      setAddingSubtask(false);
    }
  }

  const subtasks = currentTask.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.isCompleted).length;
  const subtaskProgress = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-[600px] p-0 flex flex-col h-full bg-surface overflow-hidden">
        {/* Header matching HTML Mockup 1 */}
        <SheetHeader className="px-6 py-4 border-b border-border-base bg-surface-subtle/30 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="bg-brand/10 text-brand text-xs font-mono font-bold px-2 py-0.5 rounded-md border border-brand/20">
                {currentTask.taskCode || "TASK-1001"}
              </span>
              <span className="text-text-tertiary text-sm">/</span>
              <span className="text-xs font-medium text-text-tertiary">Task Workspace</span>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-xs" className="h-7 w-7 text-text-tertiary">
                <Star className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon-xs" className="h-7 w-7 text-text-tertiary" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <h2 className="font-heading font-bold text-xl text-text-primary leading-tight mb-1">
              {currentTask.title}
            </h2>
            <p className="text-xs text-text-tertiary">
              Updated {currentTask.completedAt ? "completed" : "recently"}
            </p>
          </div>

          {/* Attributes Grid */}
          <div className="grid grid-cols-3 gap-4 py-4 border-y border-border-base/60">
            {/* Status */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Status</span>
              <select
                className="w-full h-8 rounded-lg border border-border-base bg-surface px-2 text-xs font-semibold text-text-primary focus:border-brand focus:outline-none"
                value={currentTask.status}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
              >
                <option value="BACKLOG">Backlog</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Priority</span>
              <select
                className="w-full h-8 rounded-lg border border-border-base bg-surface px-2 text-xs font-semibold text-text-primary focus:border-brand focus:outline-none"
                value={currentTask.priority}
                onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            {/* Assignee */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Assignee</span>
              <select
                className="w-full h-8 rounded-lg border border-border-base bg-surface px-2 text-xs font-semibold text-text-primary focus:border-brand focus:outline-none"
                value={currentTask.assigneeId || ""}
                onChange={(e) => handleAssigneeChange(e.target.value)}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date & Subtasks Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Due Date</span>
              <div className="flex items-center gap-2 pt-1 text-xs font-semibold text-text-primary">
                <Calendar className="h-4 w-4 text-brand" />
                <span>{currentTask.dueDate ? new Date(currentTask.dueDate).toLocaleDateString() : "No Due Date"}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-text-tertiary">
                <span>Subtasks Progress</span>
                <span className="text-brand font-mono">{completedSubtasks} / {subtasks.length}</span>
              </div>
              <div className="h-2 w-full bg-surface-subtle rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-brand rounded-full transition-all duration-300"
                  style={{ width: `${subtaskProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-primary">Description (Rich Text)</span>
              <span className="text-[10px] text-text-tertiary">Auto-saves on change</span>
            </div>
            <RichTextEditor
              value={currentTask.description || ""}
              onChange={async (val) => {
                setCurrentTask((t) => ({ ...t, description: val }));
                try {
                  await api.updateTask(task.id, { description: val });
                  onTaskUpdated();
                } catch (err) {
                  // silent update error
                }
              }}
              placeholder="Add detailed task description, acceptance criteria, wireframe links..."
            />
          </div>

          {/* Subtasks Checklist */}
          <div className="space-y-2 pt-2 border-t border-border-base/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-primary">Subtasks Checklist</span>
            </div>

            <div className="flex gap-2">
              <input
                className="h-8 flex-1 rounded-md border border-border-base bg-surface px-2.5 text-xs focus:border-brand focus:outline-none"
                placeholder="Add subtask title..."
                value={subtaskTitle}
                onChange={(e) => setSubtaskTitle(e.target.value)}
              />
              <Button size="sm" onClick={handleAddSubtask} disabled={addingSubtask} className="text-xs h-8 bg-brand hover:bg-brand-hover text-white">
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>

            <div className="space-y-1 pt-1">
              {subtasks.map((st) => (
                <div key={st.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-subtle/40 text-xs">
                  <input
                    type="checkbox"
                    checked={st.isCompleted}
                    onChange={() => {
                      api.updateTaskStatus(st.id, st.isCompleted ? "TODO" : "DONE").then(() => onTaskUpdated());
                    }}
                    className="rounded text-brand focus:ring-brand"
                  />
                  <span className={cn("flex-1", st.isCompleted && "line-through text-text-tertiary")}>{st.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Threaded Comments */}
          <div className="space-y-3 pt-4 border-t border-border-base/60">
            <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-brand" /> Comments ({comments.length})
            </span>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                className="h-8 flex-1 rounded-md border border-border-base bg-surface px-2.5 text-xs focus:border-brand focus:outline-none"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <Button type="submit" size="sm" disabled={addingComment} className="text-xs h-8 bg-brand hover:bg-brand-hover text-white">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>

            <div className="space-y-2 pt-2">
              {comments.map((c) => (
                <div key={c.id} className="p-3 rounded-lg border border-border-base bg-surface-subtle/20 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-text-tertiary text-[11px]">
                    <span className="font-bold text-text-primary">{c.user?.firstName} {c.user?.lastName}</span>
                    <span>{new Date(c.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-text-primary leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
