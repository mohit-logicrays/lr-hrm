"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import {
  Bell,
  CheckCheck,
  Trash2,
  Settings,
  Sparkles,
  ChevronRight,
  Inbox,
  Volume2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { api, type NotificationItem } from "@/lib/api";
import { NotificationItemRow } from "./NotificationItem";
import { cn } from "@/lib/utils";

export function NotificationBellDropdown() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(false);

  // Poll unread count & load notifications
  const loadNotifications = async () => {
    try {
      const res = await api.listNotifications(1, 15, filter === "unread");
      setItems(res.data || []);
      setUnreadCount(res.unreadCount || 0);
    } catch {
      // Silent error handling
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000); // 15s proactive polling

    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        loadNotifications();
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [filter]);

  // Request browser push permission if supported
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

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

  async function handleMarkAllRead() {
    try {
      await api.markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All marked as read");
    } catch {
      toast.error("Failed to mark all read");
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteNotification(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification removed");
    } catch {
      toast.error("Failed to delete");
    }
  }

  async function handleClearAll() {
    if (!window.confirm("Clear all notifications?")) return;
    try {
      await api.clearAllNotifications();
      setItems([]);
      setUnreadCount(0);
      toast.success("All notifications cleared");
    } catch {
      toast.error("Failed to clear notifications");
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Notifications"
          className="relative p-2 rounded-full hover:bg-surface-subtle text-text-secondary hover:text-brand transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer"
        >
          <Bell className="h-5 w-5 transition-transform group-hover:scale-105" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white shadow-2xs font-mono">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 sm:w-96 rounded-2xl p-0 shadow-xl border-border-base overflow-hidden"
      >
        {/* Header with Title and Quick Actions */}
        <div className="p-4 border-b border-border-base bg-surface-subtle/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-heading text-sm font-bold text-text-primary">
              Notifications
            </span>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold bg-brand/10 text-brand px-2 py-0.5 rounded-full font-mono">
                {unreadCount} New
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] text-brand hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="h-3 w-3" /> Mark all read
              </button>
            )}

            <Link
              href="/notifications/preferences"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-md hover:bg-surface text-text-tertiary hover:text-text-primary transition-colors"
              title="Notification Settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2 border-b border-border-base/50 flex items-center gap-2 bg-surface">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer",
              filter === "all"
                ? "bg-brand text-white shadow-2xs"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
            )}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={cn(
              "text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer",
              filter === "unread"
                ? "bg-brand text-white shadow-2xs"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
            )}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* List of Notifications */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1.5">
          {items.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-tertiary flex flex-col items-center justify-center">
              <Inbox className="h-8 w-8 text-text-tertiary/40 mb-2" />
              <p className="font-medium text-text-secondary">No notifications found</p>
              <p className="text-[11px] mt-0.5">You are all caught up!</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <NotificationItemRow
                  key={item.id}
                  item={item}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-2.5 border-t border-border-base bg-surface-subtle/40 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11px] text-text-tertiary hover:text-error transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              <Trash2 className="h-3 w-3" /> Clear all
            </button>

            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-[11px] text-brand hover:underline font-semibold flex items-center gap-0.5"
            >
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
