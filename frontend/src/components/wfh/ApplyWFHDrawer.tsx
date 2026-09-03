"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Send, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { api, type WFHRequest, type Holiday } from "@/lib/api";

interface ApplyWFHDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (item?: WFHRequest) => void;
}

export function ApplyWFHDrawer({ isOpen, onClose, onSuccess }: ApplyWFHDrawerProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState(1);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [workDaysPerWeek, setWorkDaysPerWeek] = useState(5);

  useEffect(() => {
    if (isOpen) {
      api.listHolidays(1, 100).then((res) => {
        setHolidays(res.data || []);
      }).catch(() => {});

      api.getWorkingDaysConfig().then((res) => {
        if (res.data?.workingDaysPerWeek) {
          setWorkDaysPerWeek(res.data.workingDaysPerWeek);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  function isLastSaturday(d: Date): boolean {
    if (d.getDay() !== 6) return false;
    const nextWeek = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7);
    return nextWeek.getMonth() !== d.getMonth();
  }

  function calculateWorkingDays(startStr: string, endStr: string) {
    if (!startStr || !endStr) return;
    const s = new Date(startStr);
    const e = new Date(endStr);
    if (e < s) {
      setDays(0);
      return;
    }

    const holidaySet = new Set(
      holidays
        .filter((h) => !h.isOptional)
        .map((h) => {
          const hd = new Date(h.date);
          return `${hd.getFullYear()}-${String(hd.getMonth() + 1).padStart(2, "0")}-${String(hd.getDate()).padStart(2, "0")}`;
        })
    );

    let count = 0;
    const cur = new Date(s.getFullYear(), s.getMonth(), s.getDate());
    const last = new Date(e.getFullYear(), e.getMonth(), e.getDate());

    while (cur <= last) {
      const day = cur.getDay();
      const dateKey = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;

      if (!holidaySet.has(dateKey)) {
        if (day === 0) {
          // Sunday is always off
        } else if (day === 6) {
          // Saturday: Last Saturday of month is always working, or if 6-day work week
          if (isLastSaturday(cur) || workDaysPerWeek >= 6) {
            count++;
          }
        } else if (day <= workDaysPerWeek) {
          count++;
        }
      }
      cur.setDate(cur.getDate() + 1);
    }

    setDays(count);
  }

  function handleQuickDate(type: "today" | "tomorrow" | "nextWeek") {
    const today = new Date();
    if (type === "today") {
      const d = today.toISOString().split("T")[0];
      setStartDate(d);
      setEndDate(d);
      calculateWorkingDays(d, d);
    } else if (type === "tomorrow") {
      const tom = new Date(today);
      tom.setDate(today.getDate() + 1);
      const d = tom.toISOString().split("T")[0];
      setStartDate(d);
      setEndDate(d);
      calculateWorkingDays(d, d);
    } else if (type === "nextWeek") {
      const nextMon = new Date(today);
      nextMon.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
      const nextFri = new Date(nextMon);
      nextFri.setDate(nextMon.getDate() + 4);
      const s = nextMon.toISOString().split("T")[0];
      const e = nextFri.toISOString().split("T")[0];
      setStartDate(s);
      setEndDate(e);
      calculateWorkingDays(s, e);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast.error("Please select start and end dates");
      return;
    }
    if (reason.trim().length < 3) {
      toast.error("Please provide a reason (at least 3 characters)");
      return;
    }

    setLoading(true);
    try {
      const res = await api.applyWFH({
        startDate,
        endDate,
        days,
        reason,
      });
      toast.success("WFH request submitted successfully");
      // Reset form
      setStartDate("");
      setEndDate("");
      setReason("");
      setDays(1);
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit WFH request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md w-full bg-surface p-0 flex flex-col h-full border-l border-border-base">
        {/* Drawer Header */}
        <SheetHeader className="p-5 border-b border-border-base bg-surface-subtle/50 shrink-0">
          <SheetTitle className="font-heading text-base font-bold text-text-primary">
            Apply WFH
          </SheetTitle>
          <SheetDescription className="text-xs text-text-tertiary">
            Submit a new work from home request for managerial approval.
          </SheetDescription>
        </SheetHeader>

        {/* Drawer Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Quick Date Pills */}
          <div>
            <Label className="text-xs font-semibold text-text-secondary block mb-2">Quick Presets</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleQuickDate("today")}
                className="px-3 py-1.5 rounded-lg border border-border-base text-xs font-medium text-text-secondary hover:bg-surface-subtle hover:text-text-primary transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate("tomorrow")}
                className="px-3 py-1.5 rounded-lg border border-border-base text-xs font-medium text-text-secondary hover:bg-surface-subtle hover:text-text-primary transition-colors cursor-pointer"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate("nextWeek")}
                className="px-3 py-1.5 rounded-lg border border-brand/30 bg-brand/5 text-xs font-semibold text-brand hover:bg-brand/10 transition-colors cursor-pointer"
              >
                Next Week
              </button>
            </div>
          </div>

          {/* Date Range Section */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-text-secondary">Date Range & Duration</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="start-date" className="text-[11px] text-text-tertiary">Start Date *</Label>
                <Input
                  id="start-date"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    calculateWorkingDays(e.target.value, endDate);
                  }}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="end-date" className="text-[11px] text-text-tertiary">End Date *</Label>
                <Input
                  id="end-date"
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    calculateWorkingDays(startDate, e.target.value);
                  }}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {startDate && endDate && (
              <div className="flex items-center justify-between bg-surface-subtle p-2.5 rounded-xl border border-border-base text-xs">
                <span className="text-text-tertiary">Calculated Working Days:</span>
                <span className="font-bold text-brand font-mono flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {days} {days === 1 ? "Day" : "Days"}
                </span>
              </div>
            )}
          </div>

          {/* Reason / Description Section with TipTap */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-xs font-semibold text-text-secondary">
              Description & Reason <span className="text-error">*</span>
            </Label>
            <p className="text-[11px] text-text-tertiary">Provide detailed context, tasks planned, or justification for your remote work.</p>
            <RichTextEditor
              value={reason}
              onChange={setReason}
              placeholder="e.g. Working on architecture documentation, sprints, doctor appointments..."
            />
          </div>

          {/* Drawer Footer Actions inside Form */}
          <div className="pt-4 border-t border-border-base flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-9 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-brand text-white hover:bg-brand-hover text-xs h-9 gap-1.5 font-semibold cursor-pointer shadow-2xs"
            >
              <Send className="h-3.5 w-3.5" /> {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
