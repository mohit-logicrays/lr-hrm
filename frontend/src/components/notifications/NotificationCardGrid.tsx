"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Trash2,
  ArrowRight,
  Check,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type NotificationItem } from "@/lib/api";
import {
  getTypeIcon,
  getTypeIconBg,
  getTypeLabel,
  formatTimeAgo,
  formatDateLabel,
  type DateGroup,
  getDateGroup,
  groupNotificationsByDate,
} from "./notification-utils";
import { cn } from "@/lib/utils";

interface NotificationCardGridItemProps {
  item: NotificationItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onApprove?: (item: NotificationItem) => void;
  onReject?: (item: NotificationItem) => void;
}

const ACTION_TYPES = ["wfh", "leave"];

function NotificationCardGridItem({
  item,
  isSelected,
  onToggleSelect,
  onMarkRead,
  onDelete,
  onApprove,
  onReject,
}: NotificationCardGridItemProps) {
  const router = useRouter();
  const isUnread = !item.isRead;
  const isApprovalType = ACTION_TYPES.includes(item.type?.toLowerCase());
  const hasApprovalActions = isApprovalType && isUnread && (onApprove || onReject);

  function handleClick() {
    if (isUnread) onMarkRead(item.id);
    if (item.link) router.push(item.link);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "relative p-5 border rounded-xl shadow-2xs flex flex-col justify-between h-full bg-surface transition-all group cursor-pointer overflow-hidden",
          !isUnread && "opacity-70",
          isSelected
            ? "ring-2 ring-brand/30 border-brand/30"
            : isUnread
            ? "border-l-4 border-l-brand border-border-base"
            : "border-border-base"
        )}
        onClick={handleClick}
      >
        {/* Top row: type icon + checkbox + timestamp */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            {/* Checkbox */}
            <div
              onClick={(e) => { e.stopPropagation(); onToggleSelect(item.id); }}
              className={cn(
                "h-4 w-4 rounded border-[1.5px] flex items-center justify-center shrink-0 transition-all cursor-pointer",
                isSelected
                  ? "bg-brand border-brand"
                  : "border-border-base opacity-0 group-hover:opacity-100"
              )}
            >
              {isSelected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
            </div>

            {/* Circular icon */}
            <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", getTypeIconBg(item.type))}>
              {getTypeIcon(item.type, "h-[18px] w-[18px]")}
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1.5">
            {isUnread && (
              <span className="h-2 w-2 rounded-full bg-brand animate-pulse shrink-0" />
            )}
            <Badge
              variant="outline"
              className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0 h-4 border-border-base text-text-tertiary"
            >
              {getTypeLabel(item.type)}
            </Badge>
          </div>
        </div>

        {/* Title */}
        <h3 className={cn(
          "font-heading font-bold text-sm leading-snug mb-1.5 line-clamp-2",
          isUnread ? "text-text-primary" : "text-text-secondary"
        )}>
          {item.title}
        </h3>

        {/* Message */}
        <p className="text-xs text-text-tertiary leading-relaxed line-clamp-3 mb-4 flex-1">
          {item.message}
        </p>

        {/* Footer */}
        <div className="pt-3 border-t border-border-base/60 flex items-center justify-between mt-auto gap-2">
          {/* Timestamp */}
          <span className="flex items-center gap-1 text-[10px] text-text-tertiary/80 font-mono">
            <Clock className="h-3 w-3" />
            {isUnread ? formatTimeAgo(item.createdAt) : formatDateLabel(item.createdAt)}
          </span>

          {/* Actions */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {hasApprovalActions ? (
              <div className="flex items-center gap-1">
                {onApprove && (
                  <Button
                    size="sm"
                    onClick={() => onApprove(item)}
                    className="h-7 px-2.5 text-[11px] bg-brand text-white hover:bg-brand/90 font-bold cursor-pointer rounded-lg shadow-2xs"
                  >
                    Approve
                  </Button>
                )}
                {onReject && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReject(item)}
                    className="h-7 px-2.5 text-[11px] text-text-secondary hover:text-error hover:border-error/30 font-semibold cursor-pointer rounded-lg"
                  >
                    Reject
                  </Button>
                )}
              </div>
            ) : item.link ? (
              <Link
                href={item.link}
                className="inline-flex items-center gap-0.5 text-[11px] text-brand font-semibold hover:underline"
              >
                View <ArrowRight className="h-3 w-3" />
              </Link>
            ) : (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {isUnread && (
                  <button
                    type="button"
                    onClick={() => onMarkRead(item.id)}
                    title="Mark as read"
                    className="p-1 rounded-md text-text-tertiary hover:text-success hover:bg-success/10 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  title="Delete"
                  className="p-1 rounded-md text-text-tertiary hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/* ─── Card Grid View ─── */
interface NotificationCardGridProps {
  items: NotificationItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onApprove?: (item: NotificationItem) => void;
  onReject?: (item: NotificationItem) => void;
}

const GROUP_COLOR: Record<DateGroup, string> = {
  Today:     "text-brand",
  Yesterday: "text-text-secondary",
  Earlier:   "text-text-tertiary",
};

export function NotificationCardGrid({
  items,
  selectedIds,
  onToggleSelect,
  onMarkRead,
  onDelete,
  onApprove,
  onReject,
}: NotificationCardGridProps) {
  const groups = groupNotificationsByDate(items);

  return (
    <div className="space-y-8">
      {groups.map(({ group, items: groupItems }) => (
        <motion.div
          key={group}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Group divider */}
          <div className="flex items-center gap-3 mb-4">
            <span className={cn("text-[11px] font-bold uppercase tracking-widest font-heading whitespace-nowrap", GROUP_COLOR[group])}>
              {group}
            </span>
            <div className="flex-1 h-px bg-border-base" />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {groupItems.map((item) => (
                <NotificationCardGridItem
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
      ))}
    </div>
  );
}
