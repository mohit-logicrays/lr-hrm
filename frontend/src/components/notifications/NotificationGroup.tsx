"use client";

import { motion, AnimatePresence } from "framer-motion";
import { type NotificationItem } from "@/lib/api";
import { NotificationCard } from "./NotificationCard";
import { type DateGroup } from "./notification-utils";

interface NotificationGroupProps {
  group: DateGroup;
  items: NotificationItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onApprove?: (item: NotificationItem) => void;
  onReject?: (item: NotificationItem) => void;
}

export function NotificationGroup({
  group,
  items,
  selectedIds,
  onToggleSelect,
  onMarkRead,
  onDelete,
  onApprove,
  onReject,
}: NotificationGroupProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* ── Group divider — matches HTML reference exactly ── */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary font-heading whitespace-nowrap">
          {group}
        </span>
        <div className="flex-1 h-px bg-border-base" />
      </div>

      {/* ── Cards ── */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <NotificationCard
              key={item.id}
              item={item}
              isSelected={selectedIds.has(item.id)}
              onToggleSelect={onToggleSelect}
              onMarkRead={onMarkRead}
              onDelete={onDelete}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
