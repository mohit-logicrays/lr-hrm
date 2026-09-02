"use client";

import { useState, FormEvent, useEffect } from "react";
import { toast } from "sonner";
import { api, type LeaveRequest, type LeaveType } from "@/lib/api";
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
import { Pencil, Sun, Sunset } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditLeaveSheetProps {
  request: LeaveRequest | null;
  onClose: () => void;
  onSuccess: () => void;
  leaveTypes: LeaveType[];
}

export function EditLeaveSheet({
  request,
  onClose,
  onSuccess,
  leaveTypes,
}: EditLeaveSheetProps) {
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDaySession, setHalfDaySession] = useState<"FIRST_HALF" | "SECOND_HALF">("FIRST_HALF");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (request) {
      setLeaveTypeId(request.leaveTypeId);
      setStartDate(request.startDate.split("T")[0]);
      setEndDate(request.endDate.split("T")[0]);
      setReason(request.reason || "");
      setIsHalfDay(Boolean(request.isHalfDay));
      setHalfDaySession(request.halfDaySession === "SECOND_HALF" ? "SECOND_HALF" : "FIRST_HALF");
    }
  }, [request]);

  if (!request) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!request) return;

    setSubmitting(true);
    try {
      await api.updateLeaveRequest(request.id, {
        leaveTypeId,
        startDate,
        endDate,
        reason,
        isHalfDay,
        halfDaySession: isHalfDay ? halfDaySession : null,
      });
      toast.success("Leave request updated by HR");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update leave request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={Boolean(request)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md w-full bg-surface p-0 flex flex-col h-full border-l border-border-base">
        {/* Header */}
        <SheetHeader className="p-6 border-b border-border-base bg-surface-subtle/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shadow-2xs font-bold">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="font-heading text-lg font-bold text-text-primary">
                Edit Leave Request (HR Admin)
              </SheetTitle>
              <SheetDescription className="text-xs text-text-tertiary">
                Editing leave details for {request.user?.firstName} {request.user?.lastName}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Leave Type */}
          <div className="space-y-1">
            <Label htmlFor="edit-leave-type" className="text-xs font-semibold text-text-primary">
              Leave Type *
            </Label>
            <select
              id="edit-leave-type"
              required
              className="w-full h-9 rounded-md border border-border-base bg-surface px-3 text-xs font-medium text-text-primary focus:border-brand focus:outline-none"
              value={leaveTypeId}
              onChange={(e) => setLeaveTypeId(e.target.value)}
            >
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="edit-start-date" className="text-xs font-semibold text-text-primary">
                Start Date *
              </Label>
              <Input
                id="edit-start-date"
                type="date"
                required
                className="text-xs h-9"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-end-date" className="text-xs font-semibold text-text-primary">
                End Date *
              </Label>
              <Input
                id="edit-end-date"
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
                id="edit-half-day"
                checked={isHalfDay}
                onChange={(e) => setIsHalfDay(e.target.checked)}
                className="h-4 w-4 rounded border-border-base text-brand focus:ring-brand"
              />
              <Label htmlFor="edit-half-day" className="text-xs font-semibold text-text-primary cursor-pointer">
                Half Day Session
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

          {/* Reason / Notes */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-text-primary">Reason / Notes (Rich Text)</Label>
            <RichTextEditor
              value={reason}
              onChange={(val) => setReason(val)}
              placeholder="Edit reason or notes..."
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
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
