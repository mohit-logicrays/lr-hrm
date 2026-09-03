"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Bell,
  CheckCheck,
  Trash2,
  Settings,
  Filter,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api, type NotificationItem } from "@/lib/api";
import { NotificationItemRow } from "@/components/notifications/NotificationItem";
import { cn } from "@/lib/utils";

export default function NotificationsCenterPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkOperating, setIsBulkOperating] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.listNotifications(page, 20, filter === "unread");
      let list = res.data || [];
      if (typeFilter) {
        list = list.filter((n) => n.type.toLowerCase() === typeFilter.toLowerCase());
      }
      setItems(list);
      setUnreadCount(res.unreadCount || 0);
      setTotalCount(res.pagination?.total || list.length);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    setSelectedIds(new Set());
  }, [page, filter, typeFilter]);

  // Proactive periodic polling (every 15s) + focus sync
  useEffect(() => {
    const interval = setInterval(loadData, 15000);
    const onFocus = () => {
      if (document.visibilityState === "visible") loadData();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [page, filter, typeFilter]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllPage = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  async function handleMarkRead(id: string) {
    try {
      await api.markNotificationRead(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      toast.error("Failed to mark as read");
    }
  }

  // Bulk Read Selected Items
  async function handleBulkReadSelected() {
    if (selectedIds.size === 0) return;
    try {
      setIsBulkOperating(true);
      const idsToMark = Array.from(selectedIds);
      await Promise.all(idsToMark.map((id) => api.markNotificationRead(id)));
      setItems((prev) =>
        prev.map((n) => (selectedIds.has(n.id) ? { ...n, isRead: true } : n))
      );
      setSelectedIds(new Set());
      setUnreadCount((prev) => Math.max(0, prev - idsToMark.length));
      toast.success(`Marked ${idsToMark.length} notifications as read`);
    } catch {
      toast.error("Failed to mark selected notifications as read");
    } finally {
      setIsBulkOperating(false);
    }
  }

  // Wildcard Global Mark All Read (All Pages across Entire Database)
  async function handleMarkAllRead() {
    try {
      setIsBulkOperating(true);
      await api.markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setSelectedIds(new Set());
      setUnreadCount(0);
      toast.success("All notifications across entire account marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    } finally {
      setIsBulkOperating(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteNotification(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success("Notification removed");
    } catch {
      toast.error("Failed to delete notification");
    }
  }

  async function handleClearAll() {
    if (!window.confirm("Are you sure you want to clear all your notifications?")) return;
    try {
      await api.clearAllNotifications();
      setItems([]);
      setSelectedIds(new Set());
      setUnreadCount(0);
      toast.success("All notifications cleared");
    } catch {
      toast.error("Failed to clear notifications");
    }
  }

  const isAllPageSelected = items.length > 0 && selectedIds.size === items.length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-text-primary flex items-center gap-2.5">
            <Bell className="h-6 w-6 text-brand" />
            Notification Center
            {unreadCount > 0 && (
              <span className="text-xs bg-brand/10 text-brand px-2.5 py-0.5 rounded-full font-mono font-semibold">
                {unreadCount} Unread
              </span>
            )}
          </h1>
          <p className="text-xs text-text-tertiary mt-1">
            Real-time alerts, announcements, policies, approvals, and reminders.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Wildcard Bulk Read */}
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isBulkOperating}
              className="text-xs h-8 gap-1.5 font-semibold text-brand border-brand/30 hover:bg-brand/10 cursor-pointer shadow-2xs"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark Everything Read (Wildcard)
            </Button>
          )}

          {items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="text-xs h-8 gap-1.5 font-medium text-text-secondary hover:text-error hover:border-error/30 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear All
            </Button>
          )}

          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs h-8 gap-1.5 font-medium cursor-pointer"
          >
            <Link href="/notifications/preferences">
              <Settings className="h-3.5 w-3.5" /> Preferences
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Bulk Actions Bar */}
      <Card className="p-4 border border-border-base bg-surface shadow-2xs rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Bulk Select Page Checkbox */}
          {items.length > 0 && (
            <div className="flex items-center gap-2 mr-2 pr-3 border-r border-border-base">
              <input
                type="checkbox"
                id="select-all-checkbox"
                checked={isAllPageSelected}
                onChange={selectAllPage}
                className="h-4 w-4 rounded border-border-base text-brand focus:ring-brand cursor-pointer accent-brand"
              />
              <label htmlFor="select-all-checkbox" className="text-xs font-semibold text-text-secondary cursor-pointer select-none">
                Select Page ({selectedIds.size}/{items.length})
              </label>
            </div>
          )}

          {/* Selected Action Buttons */}
          {selectedIds.size > 0 && (
            <Button
              size="sm"
              onClick={handleBulkReadSelected}
              disabled={isBulkOperating}
              className="text-xs h-7 px-2.5 bg-brand text-white font-semibold cursor-pointer shadow-2xs gap-1"
            >
              <CheckCheck className="h-3 w-3" /> Mark Selected Read ({selectedIds.size})
            </Button>
          )}

          <button
            type="button"
            onClick={() => {
              setPage(1);
              setFilter("all");
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              filter === "all"
                ? "bg-brand text-white shadow-2xs"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
            )}
          >
            All Alerts
          </button>
          <button
            type="button"
            onClick={() => {
              setPage(1);
              setFilter("unread");
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              filter === "unread"
                ? "bg-brand text-white shadow-2xs"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
            )}
          >
            Unread Only ({unreadCount})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => {
              setPage(1);
              setTypeFilter(e.target.value);
            }}
            className="h-8 rounded-lg border border-border-base bg-surface px-2.5 text-xs font-medium text-text-primary focus:border-brand focus:outline-none cursor-pointer"
          >
            <option value="">All Categories</option>
            <option value="announcement">Announcements</option>
            <option value="policy">Policies</option>
            <option value="leave">Leaves</option>
            <option value="wfh">Work From Home (WFH)</option>
            <option value="timesheet">Timesheets</option>
            <option value="project">Projects</option>
            <option value="task">Tasks</option>
            <option value="support">Support</option>
            <option value="system">System</option>
          </select>
        </div>
      </Card>

      {/* Main List */}
      <Card className="p-4 border border-border-base bg-surface shadow-2xs rounded-xl space-y-2">
        {loading ? (
          <div className="py-16 text-center text-xs text-text-tertiary">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand border-t-transparent mx-auto mb-2" />
            Loading notifications...
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-xs text-text-tertiary flex flex-col items-center justify-center">
            <Inbox className="h-10 w-10 text-text-tertiary/40 mb-2" />
            <p className="font-semibold text-text-secondary text-sm">No notifications found</p>
            <p className="text-[11px] mt-0.5">Everything is up to date.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <NotificationItemRow
                  key={item.id}
                  item={item}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                  isSelected={selectedIds.has(item.id)}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pt-4 border-t border-border-base flex items-center justify-between text-xs text-text-tertiary">
            <span>
              Page {page} of {totalPages} ({totalCount} total)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-7 w-7 cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-7 w-7 cursor-pointer"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
