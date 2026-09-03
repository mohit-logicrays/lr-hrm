"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Trash2,
  ArrowRight,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type NotificationItem } from "@/lib/api";
import {
  getTypeIcon,
  getTypeIconBg,
  getTypeLabel,
  formatTimeAgo,
  formatDateLabel,
} from "./notification-utils";
import { cn } from "@/lib/utils";

interface NotificationCardProps {
  item: NotificationItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onApprove?: (item: NotificationItem) => void;
  onReject?: (item: NotificationItem) => void;
}

const ACTION_TYPES = ["wfh", "leave"];

export function NotificationCard({
  item,
  isSelected,
  onToggleSelect,
  onMarkRead,
  onDelete,
  onApprove,
  onReject,
}: NotificationCardProps) {
  const router = useRouter();
  const isUnread = !item.isRead;
  const isApprovalType = ACTION_TYPES.includes(item.type?.toLowerCase());
  const hasApprovalActions = isApprovalType && isUnread && (onApprove || onReject);

  function handleCardClick() {
    if (isUnread) onMarkRead(item.id);
    if (item.link) router.push(item.link);
  }

  const timestamp = isUnread
    ? formatTimeAgo(item.createdAt)
    : formatDateLabel(item.createdAt);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative bg-surface rounded-xl shadow-2xs hover:shadow-sm transition-all flex items-start gap-4 p-5 border border-border-base cursor-pointer group",
        !isUnread && "opacity-75",
        isSelected && "ring-2 ring-brand/30 bg-brand/[0.02]"
      )}
    >
      {/* Unread dot — absolute, mimics the HTML reference exactly */}
      {isUnread && (
        <span className="absolute top-5 left-2 w-2 h-2 bg-brand rounded-full" />
      )}

      {/* Checkbox — appears on hover or when something is selected */}
      <div
        onClick={(e) => { e.stopPropagation(); onToggleSelect(item.id); }}
        className={cn(
          "absolute top-4 right-4 cursor-pointer transition-opacity",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      >
        <div className={cn(
          "h-4 w-4 rounded border-[1.5px] flex items-center justify-center transition-all",
          isSelected
            ? "bg-brand border-brand"
            : "border-border-base bg-surface hover:border-brand/60"
        )}>
          {isSelected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
        </div>
      </div>

      {/* Circular type icon — matches reference design exactly */}
      <div
        onClick={handleCardClick}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shrink-0 ml-2",
          getTypeIconBg(item.type)
        )}
      >
        {getTypeIcon(item.type, "h-[20px] w-[20px]")}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-6" onClick={handleCardClick}>
        {/* Title + Timestamp row */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-bold font-heading text-text-primary truncate">
              {item.title}
            </h3>
            {/* "Critical" badge from the reference (for system type) */}
            {item.type?.toLowerCase() === "system" && isUnread && (
              <Badge className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-error/10 text-error border-error/20 rounded-full shrink-0">
                Critical
              </Badge>
            )}
          </div>
          <span className="text-xs text-text-tertiary whitespace-nowrap shrink-0">
            {timestamp}
          </span>
        </div>

        {/* Message body */}
        <p className="text-sm text-text-secondary leading-relaxed line-clamp-2 mb-3">
          {item.message}
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          {/* Approve / Reject for WFH/Leave */}
          {hasApprovalActions ? (
            <>
              {onApprove && (
                <Button
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onApprove(item); }}
                  className="h-8 px-4 text-xs bg-brand text-white hover:bg-brand/90 font-semibold cursor-pointer rounded-lg shadow-2xs"
                >
                  Approve
                </Button>
              )}
              {onReject && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => { e.stopPropagation(); onReject(item); }}
                  className="h-8 px-4 text-xs text-text-secondary border-border-base hover:bg-surface-subtle font-semibold cursor-pointer rounded-lg"
                >
                  Reject
                </Button>
              )}
            </>
          ) : item.link ? (
            /* View link */
            <Link
              href={item.link}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-brand font-semibold hover:underline"
            >
              View details{" "}
              {item.link.startsWith("http") ? (
                <ExternalLink className="h-3 w-3" />
              ) : (
                <ArrowRight className="h-3 w-3" />
              )}
            </Link>
          ) : null}
        </div>
      </div>

      {/* Hover action buttons — mark read + delete */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isUnread && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMarkRead(item.id); }}
            title="Mark as read"
            className="p-1.5 rounded-lg text-text-tertiary hover:text-success hover:bg-success/10 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
          title="Delete"
          className="p-1.5 rounded-lg text-text-tertiary hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
