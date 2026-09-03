"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCheck,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface MarkAllReadDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  totalUnread: number;
}

export function MarkAllReadDialog({
  open,
  onClose,
  onConfirm,
  isLoading,
  totalUnread,
}: MarkAllReadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl border border-border-base bg-surface shadow-xl p-0 overflow-hidden gap-0">
        {/* Icon banner */}
        <div className="flex items-center justify-center py-8 bg-brand/5 border-b border-border-base/60">
          <div className="w-14 h-14 rounded-full bg-brand/10 border-2 border-brand/20 flex items-center justify-center">
            <CheckCheck className="h-7 w-7 text-brand" />
          </div>
        </div>

        <div className="p-6">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="font-heading text-lg font-extrabold text-text-primary">
              Mark All as Read?
            </DialogTitle>
            <DialogDescription className="text-sm text-text-secondary mt-1 leading-relaxed">
              This will mark{" "}
              <span className="font-bold text-text-primary">
                {totalUnread > 0 ? `all ${totalUnread} unread` : "all"}
              </span>{" "}
              notifications as read. You won't be able to identify which ones were new.
            </DialogDescription>
          </DialogHeader>

          {/* Warning note */}
          <div className="flex items-start gap-3 bg-warning/8 border border-warning/20 rounded-xl p-3.5 mb-5">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary leading-relaxed">
              Pending approval requests (Leave, WFH) will also be marked as read. Make sure you've reviewed all actionable items before proceeding.
            </p>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 h-10 text-sm font-semibold cursor-pointer rounded-xl border-border-base"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 h-10 text-sm font-bold bg-brand text-white hover:bg-brand/90 cursor-pointer rounded-xl shadow-2xs gap-2"
            >
              {isLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              {isLoading ? "Marking…" : "Yes, Mark All Read"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
