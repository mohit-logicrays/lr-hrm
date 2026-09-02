"use client";

import { useState, FormEvent, useEffect } from "react";
import { toast } from "sonner";
import { api, type LeaveType } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { CalendarPlus, Info, Sun, Sunset } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApplyLeaveSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leaveTypes: LeaveType[];
  isHr?: boolean;
}

export function ApplyLeaveSheet({
  isOpen,
  onClose,
  onSuccess,
  leaveTypes,
  isHr = false,
}: ApplyLeaveSheetProps) {
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDaySession, setHalfDaySession] = useState<"FIRST_HALF" | "SECOND_HALF">("FIRST_HALF");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (leaveTypes.length > 0 && !leaveTypeId) {
      setLeaveTypeId(leaveTypes[0].id);
    }
  }, [leaveTypes, leaveTypeId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!leaveTypeId) {
      toast.error("Please select a leave type");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Please select start and end dates");
      return;
    }

    // Past date check for regular employees
    const todayStr = new Date().toISOString().split("T")[0];
    if (!isHr && startDate < todayStr) {
      toast.error("You cannot apply for leaves in the past. Only HR can apply for past leaves.");
      return;
    }

    setSubmitting(true);
    try {
      await api.createLeaveRequest({
        leaveTypeId,
        startDate,
        endDate,
        reason,
        isHalfDay,
        halfDaySession: isHalfDay ? halfDaySession : undefined,
      });
      toast.success("Leave application submitted successfully!");
      onSuccess();
      onClose();
      // Reset form
      setStartDate("");
      setEndDate("");
      setReason("");
      setIsHalfDay(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit leave application");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedType = leaveTypes.find((t) => t.id === leaveTypeId);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md w-full bg-surface p-0 flex flex-col h-full border-l border-border-base">
        {/* Header */}
        <SheetHeader className="p-6 border-b border-border-base bg-surface-subtle/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shadow-2xs font-bold">
              <CalendarPlus className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="font-heading text-lg font-bold text-text-primary">
                Apply for Leave
              </SheetTitle>
              <SheetDescription className="text-xs text-text-tertiary">
                Submit time-off request for multi-level approval (TL, PM, HR)
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Leave Type Select */}
          <div className="space-y-1">
            <Label htmlFor="leave-type" className="text-xs font-semibold text-text-primary">
              Leave Type *
            </Label>
            <select
              id="leave-type"
              required
              className="w-full h-9 rounded-md border border-border-base bg-surface px-3 text-xs font-medium text-text-primary focus:border-brand focus:outline-none"
              value={leaveTypeId}
              onChange={(e) => setLeaveTypeId(e.target.value)}
            >
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code}) {t.maxDaysPerYear ? `· Max ${t.maxDaysPerYear} days/yr` : ""}
                </option>
              ))}
            </select>
          </div>

          {selectedType && (
            <div className="p-3 rounded-lg bg-brand/5 border border-brand/20 flex items-start gap-2.5 text-xs text-text-secondary">
              <Info className="h-4 w-4 text-brand shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-text-primary block">{selectedType.name} Policy</span>
                <span className="text-[11px] text-text-tertiary">
                  {selectedType.isPaid ? "Paid Leave" : "Unpaid Leave"} · Max entitlement:{" "}
                  {selectedType.maxDaysPerYear || "Unlimited"} days per calendar year.
                </span>
              </div>
            </div>
          )}

          {/* Date Pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="start-date" className="text-xs font-semibold text-text-primary">
                Start Date *
              </Label>
              <Input
                id="start-date"
                type="date"
                required
                className="text-xs h-9"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="end-date" className="text-xs font-semibold text-text-primary">
                End Date *
              </Label>
              <Input
                id="end-date"
                type="date"
                required
                className="text-xs h-9"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Half Day Checkbox & Session Selector */}
          <div className="space-y-2 pt-1 border-t border-border-base/50">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="half-day"
                checked={isHalfDay}
                onChange={(e) => setIsHalfDay(e.target.checked)}
                className="h-4 w-4 rounded border-border-base text-brand focus:ring-brand"
              />
              <Label htmlFor="half-day" className="text-xs font-semibold text-text-primary cursor-pointer">
                Apply as Half Day
              </Label>
            </div>

            {isHalfDay && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setHalfDaySession("FIRST_HALF")}
                  className={cn(
                    "p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer",
                    halfDaySession === "FIRST_HALF"
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border-base bg-surface text-text-tertiary hover:text-text-primary"
                  )}
                >
                  <Sun className="h-4 w-4" /> First Half (Morning)
                </button>
                <button
                  type="button"
                  onClick={() => setHalfDaySession("SECOND_HALF")}
                  className={cn(
                    "p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer",
                    halfDaySession === "SECOND_HALF"
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border-base bg-surface text-text-tertiary hover:text-text-primary"
                  )}
                >
                  <Sunset className="h-4 w-4" /> Second Half (Afternoon)
                </button>
              </div>
            )}
          </div>

          {/* Reason / Description with Tiptap RichTextEditor */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-text-primary">
              Reason / Notes (Rich Text)
            </Label>
            <RichTextEditor
              value={reason}
              onChange={(val) => setReason(val)}
              placeholder="Provide reason or handoff notes for your leave request..."
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border-base flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-brand hover:bg-brand-hover text-white font-semibold"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
