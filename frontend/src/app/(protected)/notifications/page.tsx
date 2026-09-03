"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Bell,
  CheckCheck,
  Trash2,
  Settings,
  Inbox,
  X,
  Search,
  LayoutList,
  LayoutGrid,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, type NotificationItem } from "@/lib/api";
import { cn } from "@/lib/utils";

// Notification sub-components
import { NotificationFilterBar }  from "@/components/notifications/NotificationFilterBar";
import { NotificationBulkBar }    from "@/components/notifications/NotificationBulkBar";
import { NotificationGroup }      from "@/components/notifications/NotificationGroup";
import { NotificationCardGrid }   from "@/components/notifications/NotificationCardGrid";
import { NotificationPagination } from "@/components/notifications/NotificationPagination";
import { MarkAllReadDialog }       from "@/components/notifications/MarkAllReadDialog";
import { groupNotificationsByDate } from "@/components/notifications/notification-utils";

const PAGE_SIZE = 20;

const pageVariants = {
  hidden:  { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

type ViewMode = "list" | "card";

export default function NotificationsCenterPage() {
  // ── Data state ────────────────────────────────────────────────────────────
  const [items,       setItems]       = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount,  setTotalCount]  = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [loading,     setLoading]     = useState(true);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [page,      setPage]      = useState(1);
  const [activeTab, setActiveTab] = useState<string>("");
  const [search,    setSearch]    = useState("");
  const [dateRange, setDateRange] = useState("7");
  const [priority,  setPriority]  = useState("");

  // ── UI state ──────────────────────────────────────────────────────────────
  const [viewMode,         setViewMode]         = useState<ViewMode>("list");
  const [markAllDialogOpen,setMarkAllDialogOpen] = useState(false);

  // ── Bulk selection ────────────────────────────────────────────────────────
  const [selectedIds,     setSelectedIds]     = useState<Set<string>>(new Set());
  const [isBulkOperating, setIsBulkOperating] = useState(false);

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const isUnread = activeTab === "unread";
      const res = await api.listNotifications(page, PAGE_SIZE, isUnread);
      let list = res.data || [];

      if (activeTab && activeTab !== "unread") {
        list = list.filter((n) => n.type?.toLowerCase() === activeTab);
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter(
          (n) => n.title?.toLowerCase().includes(q) || n.message?.toLowerCase().includes(q)
        );
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
  }, [page, activeTab, search]);

  useEffect(() => { loadData(); setSelectedIds(new Set()); }, [page, activeTab, search]);

  useEffect(() => {
    const interval = setInterval(loadData, 15000);
    const onFocus  = () => { if (document.visibilityState === "visible") loadData(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => { clearInterval(interval); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onFocus); };
  }, [loadData]);

  // ── Selection helpers ─────────────────────────────────────────────────────
  const isAllPageSelected = items.length > 0 && selectedIds.size === items.length;
  const isSomeSelected    = selectedIds.size > 0 && !isAllPageSelected;

  const toggleSelect  = (id: string) =>
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const selectAllPage = () =>
    setSelectedIds(isAllPageSelected ? new Set() : new Set(items.map((i) => i.id)));

  const clearSelected = () => setSelectedIds(new Set());

  // ── Actions ───────────────────────────────────────────────────────────────
  async function handleMarkRead(id: string) {
    try {
      await api.markNotificationRead(id);
      setItems((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch { toast.error("Failed to mark as read"); }
  }

  async function handleBulkMarkRead() {
    if (!selectedIds.size) return;
    try {
      setIsBulkOperating(true);
      const ids = Array.from(selectedIds);
      await Promise.all(ids.map((id) => api.markNotificationRead(id)));
      const wasUnread = items.filter((n) => selectedIds.has(n.id) && !n.isRead).length;
      setItems((prev) => prev.map((n) => selectedIds.has(n.id) ? { ...n, isRead: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - wasUnread));
      setSelectedIds(new Set());
      toast.success(`Marked ${ids.length} notification${ids.length !== 1 ? "s" : ""} as read`);
    } catch { toast.error("Failed to mark selected as read"); }
    finally { setIsBulkOperating(false); }
  }

  async function handleMarkAllRead() {
    try {
      setIsBulkOperating(true);
      await api.markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setSelectedIds(new Set());
      setUnreadCount(0);
      setMarkAllDialogOpen(false);
      toast.success("All notifications marked as read");
    } catch { toast.error("Failed to mark all as read"); }
    finally { setIsBulkOperating(false); }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteNotification(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
      toast.success("Notification removed");
    } catch { toast.error("Failed to delete notification"); }
  }

  async function handleClearAll() {
    if (!window.confirm("Clear all your notifications? This cannot be undone.")) return;
    try {
      await api.clearAllNotifications();
      setItems([]); setSelectedIds(new Set()); setUnreadCount(0); setTotalCount(0);
      toast.success("All notifications cleared");
    } catch { toast.error("Failed to clear notifications"); }
  }

  async function handleApprove(item: NotificationItem) {
    if (!item.isRead) await handleMarkRead(item.id);
    if (item.link) window.location.href = item.link;
  }
  async function handleReject(item: NotificationItem) {
    if (!item.isRead) await handleMarkRead(item.id);
    if (item.link) window.location.href = item.link;
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const groups     = groupNotificationsByDate(items);
  const hasFilters = !!(search || (activeTab && activeTab !== ""));

  function clearFilters() { setSearch(""); setActiveTab(""); setPage(1); }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col w-full"
      >
        {/* ══════════════════════════════════════════════════════════════
            Header & Actions
        ══════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold font-heading tracking-tight text-text-primary flex items-center gap-2">
              <Bell className="h-6 w-6 text-brand" /> Notifications
              {unreadCount > 0 && (
                <span className="text-[11px] bg-brand text-white px-2 py-0.5 rounded-full font-mono font-bold shadow-sm ml-1">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-xs text-text-tertiary mt-1">
              Manage your alerts, approvals, and system updates.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setMarkAllDialogOpen(true)}
              disabled={unreadCount === 0 || isBulkOperating}
              className="bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-subtle text-xs h-9 px-4 gap-1.5 font-semibold cursor-pointer shadow-2xs border border-border-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all as read
            </Button>

            <Button
              asChild
              className="bg-brand text-white hover:bg-brand-hover text-xs h-9 px-4 gap-1.5 font-semibold cursor-pointer shadow-2xs"
            >
              <Link href="/notifications/preferences">
                <Settings className="h-3.5 w-3.5" />
                Settings
              </Link>
            </Button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            Filter, Search & View Switcher Bar
        ══════════════════════════════════════════════════════════════ */}
        <Card className="p-4 border border-border-base bg-surface shadow-2xs rounded-2xl mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <NotificationFilterBar
              activeTab={activeTab}
              onTabChange={(t) => { setActiveTab(t); setPage(1); }}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              priority={priority}
              onPriorityChange={setPriority}
              unreadCount={unreadCount}
            />

            <div className="flex items-center gap-2 shrink-0">
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search notifications…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-8 pr-8 py-1.5 text-xs rounded-xl border border-border-base bg-surface-subtle text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => { setSearch(""); setPage(1); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-error transition-colors cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center border border-border-base rounded-lg p-0.5 bg-surface-subtle">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  title="List view"
                  className={cn(
                    "p-1.5 rounded-md transition-colors cursor-pointer",
                    viewMode === "list"
                      ? "bg-surface text-brand shadow-2xs"
                      : "text-text-tertiary hover:text-text-primary"
                  )}
                >
                  <LayoutList className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("card")}
                  title="Card view"
                  className={cn(
                    "p-1.5 rounded-md transition-colors cursor-pointer",
                    viewMode === "card"
                      ? "bg-surface text-brand shadow-2xs"
                      : "text-text-tertiary hover:text-text-primary"
                  )}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* ══════════════════════════════════════════════════════════════
            Bulk Bar (only when there are items)
        ══════════════════════════════════════════════════════════════ */}
        {items.length > 0 && (
          <div className="mb-4">
            <NotificationBulkBar
              totalOnPage={items.length}
              selectedCount={selectedIds.size}
              isAllPageSelected={isAllPageSelected}
              isSomeSelected={isSomeSelected}
              totalCount={totalCount}
              isOperating={isBulkOperating}
              onSelectAll={selectAllPage}
              onMarkReadSelected={handleBulkMarkRead}
              onClearSelected={clearSelected}
            />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            Notification Feed
        ══════════════════════════════════════════════════════════════ */}
        {loading ? (
          <div className="py-20 text-center text-xs text-text-tertiary">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent mx-auto mb-2" />
            Loading notifications...
          </div>
        ) : items.length === 0 ? (
          <Card className="py-16 text-center text-xs text-text-tertiary flex flex-col items-center justify-center border-border-base bg-surface rounded-2xl shadow-2xs">
            <Inbox className="h-10 w-10 text-text-tertiary/40 mb-2" />
            <p className="font-semibold text-text-secondary text-sm">
              {hasFilters ? "No notifications match your filters" : "All caught up!"}
            </p>
            <p className="text-[11px] mt-0.5">
              {hasFilters
                ? "Try adjusting your search or category filter."
                : "New alerts for approvals, policies, and leaves will appear here."}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 px-4 py-1.5 bg-surface-subtle hover:bg-border-base text-text-secondary rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border border-border-base"
              >
                <X className="h-3 w-3" /> Clear Filters
              </button>
            )}
          </Card>
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === "list" ? (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-8"
              >
                {groups.map(({ group, items: groupItems }) => (
                  <NotificationGroup
                    key={group}
                    group={group}
                    items={groupItems}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelect}
                    onMarkRead={handleMarkRead}
                    onDelete={handleDelete}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <NotificationCardGrid
                  items={items}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* ══════════════════════════════════════════════════════════════
            Pagination
        ══════════════════════════════════════════════════════════════ */}
        <NotificationPagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          onPageChange={(p) => {
            setPage(p);
            setSelectedIds(new Set());
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════
          Mark All Read Confirmation Dialog
      ══════════════════════════════════════════════════════════════ */}
      <MarkAllReadDialog
        open={markAllDialogOpen}
        onClose={() => setMarkAllDialogOpen(false)}
        onConfirm={handleMarkAllRead}
        isLoading={isBulkOperating}
        totalUnread={unreadCount}
      />
    </>
  );
}
