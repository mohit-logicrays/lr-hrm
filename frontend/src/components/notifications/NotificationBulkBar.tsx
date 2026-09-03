"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCheck,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationBulkBarProps {
  totalOnPage: number;
  selectedCount: number;
  isAllPageSelected: boolean;
  isSomeSelected: boolean;
  totalCount: number;
  isOperating: boolean;
  onSelectAll: () => void;
  onMarkReadSelected: () => void;
  onClearSelected: () => void;
}

export function NotificationBulkBar({
  totalOnPage,
  selectedCount,
  isAllPageSelected,
  isSomeSelected,
  totalCount,
  isOperating,
  onSelectAll,
  onMarkReadSelected,
  onClearSelected,
}: NotificationBulkBarProps) {
  return (
    <div className="flex items-center justify-between px-5 py-3 bg-surface-subtle/60 border-b border-border-base">
      <div className="flex items-center gap-3">
        {/* Master checkbox */}
        <button
          type="button"
          onClick={onSelectAll}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className={cn(
            "h-4 w-4 rounded border-[1.5px] transition-all flex items-center justify-center shrink-0",
            isAllPageSelected
              ? "bg-brand border-brand"
              : isSomeSelected
              ? "bg-brand/30 border-brand"
              : "border-border-base group-hover:border-brand/60"
          )}>
            {isAllPageSelected && <CheckCheck className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
            {isSomeSelected && !isAllPageSelected && <div className="h-1.5 w-1.5 rounded-sm bg-brand" />}
          </div>
          <span className="text-xs font-semibold text-text-secondary">
            {selectedCount > 0
              ? `${selectedCount} of ${totalOnPage} selected`
              : "Select page"}
          </span>
        </button>

        {/* Bulk actions (appear when items selected) */}
        <AnimatePresence>
          {selectedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              className="flex items-center gap-2"
            >
              <div className="h-3.5 w-px bg-border-base" />
              <Button
                size="sm"
                onClick={onMarkReadSelected}
                disabled={isOperating}
                className="h-7 px-3 text-xs bg-brand text-white font-semibold cursor-pointer gap-1 rounded-lg shadow-2xs"
              >
                <CheckCheck className="h-3 w-3" />
                Mark Read ({selectedCount})
              </Button>
              <button
                type="button"
                onClick={onClearSelected}
                className="h-7 px-2 text-xs text-text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Deselect
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <span className="text-[10px] text-text-tertiary font-mono">
        {totalCount > 0 && `${totalOnPage} shown · ${totalCount} total`}
      </span>
    </div>
  );
}
