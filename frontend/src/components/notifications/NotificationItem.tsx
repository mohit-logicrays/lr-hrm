"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Clock,
  FolderKanban,
  CheckSquare,
  AlertTriangle,
  LifeBuoy,
  Bell,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { type NotificationItem as NotificationItemType } from "@/lib/api";
import { cn } from "@/lib/utils";

function formatTimeAgo(dateStr: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return "Just now";
  }
}

interface NotificationItemProps {
  item: NotificationItemType;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function NotificationItemRow({
  item,
  onMarkRead,
  onDelete,
  isSelected = false,
  onToggleSelect,
}: NotificationItemProps) {
  const router = useRouter();

  function getIcon(type: string) {
    switch (type) {
      case "leave":
        return <CalendarDays className="h-4 w-4 text-info shrink-0" />;
      case "timesheet":
        return <Clock className="h-4 w-4 text-brand shrink-0" />;
      case "project":
        return <FolderKanban className="h-4 w-4 text-warning shrink-0" />;
      case "task":
        return <CheckSquare className="h-4 w-4 text-success shrink-0" />;
      case "support":
        return <LifeBuoy className="h-4 w-4 text-error shrink-0" />;
      default:
        return <Bell className="h-4 w-4 text-brand shrink-0" />;
    }
  }

  function handleClick() {
    if (!item.isRead) {
      onMarkRead(item.id);
    }
    if (item.link) {
      router.push(item.link);
    }
  }

  const timeAgo = formatTimeAgo(item.createdAt);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "p-3 rounded-xl transition-all relative flex items-start justify-between gap-3 border group cursor-pointer",
        isSelected
          ? "bg-brand/10 border-brand shadow-xs"
          : item.isRead
          ? "bg-surface/50 border-transparent hover:bg-surface-subtle/70"
          : "bg-brand/5 border-brand/20 hover:bg-brand/10 shadow-2xs"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3 min-w-0">
        {onToggleSelect && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(item.id);
            }}
            className="mt-1 flex items-center justify-center cursor-pointer"
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => {}}
              className="h-4 w-4 rounded border-border-base text-brand focus:ring-brand cursor-pointer accent-brand"
            />
          </div>
        )}

        <div className="p-2 rounded-lg bg-surface border border-border-base shrink-0 shadow-2xs mt-0.5">
          {getIcon(item.type)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className={cn("text-xs font-heading font-bold truncate", !item.isRead ? "text-text-primary" : "text-text-secondary")}>
              {item.title}
            </h4>
            {!item.isRead && (
              <span className="h-2 w-2 rounded-full bg-brand shrink-0 animate-pulse" />
            )}
          </div>

          <p className="text-[11px] text-text-tertiary mt-0.5 line-clamp-2 leading-relaxed">
            {item.message}
          </p>

          <span className="text-[10px] text-text-tertiary/80 mt-1.5 block font-mono">
            {timeAgo}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!item.isRead && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(item.id);
            }}
            title="Mark as read"
            className="p-1 rounded-md text-text-tertiary hover:text-success hover:bg-surface transition-colors cursor-pointer"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          title="Delete"
          className="p-1 rounded-md text-text-tertiary hover:text-error hover:bg-surface transition-colors cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
