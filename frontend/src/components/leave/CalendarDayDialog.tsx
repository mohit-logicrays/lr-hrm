"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { type LeaveRequest } from "@/lib/api";
import { CalendarDays, Clock, Users } from "lucide-react";

interface CalendarDayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  leaveRequests: LeaveRequest[];
}

export function CalendarDayDialog({
  isOpen,
  onClose,
  selectedDate,
  leaveRequests,
}: CalendarDayDialogProps) {
  if (!selectedDate) return null;

  const dateStr = selectedDate.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Filter leave requests that fall on the selected date
  const dayLeaves = leaveRequests.filter((r) => {
    const start = new Date(r.startDate);
    const end = new Date(r.endDate);
    const cur = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const startNorm = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endNorm = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    return cur >= startNorm && cur <= endNorm && r.status === "APPROVED";
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md w-full bg-surface border border-border-base rounded-xl shadow-md p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2 text-brand">
            <CalendarDays className="h-5 w-5" />
            <DialogTitle className="font-heading text-base font-bold text-text-primary">
              Out of Office Schedule
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-text-tertiary">
            {dateStr}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-3">
          {dayLeaves.length === 0 ? (
            <div className="p-6 text-center text-xs text-text-tertiary border border-dashed border-border-base rounded-lg space-y-1">
              <Users className="h-6 w-6 text-text-tertiary mx-auto" />
              <p className="font-semibold text-text-primary">No Team Members on Leave</p>
              <p>Everyone on the team is scheduled in-office for this date.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {dayLeaves.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-lg border border-border-base bg-surface-subtle/30 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand/10 text-brand font-mono font-bold flex items-center justify-center text-xs">
                      {r.user?.firstName?.[0] || "E"}
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">
                        {r.user ? `${r.user.firstName} ${r.user.lastName}` : "Employee"}
                      </p>
                      <p className="text-[10px] text-text-tertiary font-mono">
                        {r.leaveType?.name || "Leave"}
                      </p>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-bold uppercase">
                    {r.isHalfDay
                      ? `Half Day (${r.halfDaySession === "SECOND_HALF" ? "2nd Half" : "1st Half"})`
                      : "Full Day"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
