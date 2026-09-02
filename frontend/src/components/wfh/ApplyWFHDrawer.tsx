"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X, Send, Calendar, FileText, Upload, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { api, type WFHRequest } from "@/lib/api";

interface ApplyWFHDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (item: WFHRequest) => void;
}

export function ApplyWFHDrawer({ isOpen, onClose, onSuccess }: ApplyWFHDrawerProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState(1);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  function calculateDays(startStr: string, endStr: string) {
    if (!startStr || !endStr) return;
    const s = new Date(startStr);
    const e = new Date(endStr);
    if (e >= s) {
      const diffTime = Math.abs(e.getTime() - s.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setDays(diffDays);
    }
  }

  function handleQuickDate(type: "today" | "tomorrow" | "nextWeek") {
    const today = new Date();
    if (type === "today") {
      const d = today.toISOString().split("T")[0];
      setStartDate(d);
      setEndDate(d);
      setDays(1);
    } else if (type === "tomorrow") {
      const tom = new Date(today);
      tom.setDate(today.getDate() + 1);
      const d = tom.toISOString().split("T")[0];
      setStartDate(d);
      setEndDate(d);
      setDays(1);
    } else if (type === "nextWeek") {
      const nextMon = new Date(today);
      nextMon.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
      const nextFri = new Date(nextMon);
      nextFri.setDate(nextMon.getDate() + 4);
      const s = nextMon.toISOString().split("T")[0];
      const e = nextFri.toISOString().split("T")[0];
      setStartDate(s);
      setEndDate(e);
      setDays(5);
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
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit WFH request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="w-full max-w-md bg-surface h-full shadow-2xl border-l border-border-base flex flex-col slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-border-base flex items-center justify-between bg-surface-subtle/50 shrink-0">
          <div>
            <h2 className="font-heading text-base font-bold text-text-primary">Apply WFH</h2>
            <p className="text-xs text-text-tertiary mt-0.5">Submit a new work from home request.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
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
                Next Week (5 Days)
              </button>
            </div>
          </div>

          {/* Date Range Section */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-text-secondary">Date Range & Duration</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="start-date" className="text-[11px] text-text-tertiary">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    calculateDays(e.target.value, endDate);
                  }}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="end-date" className="text-[11px] text-text-tertiary">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    calculateDays(startDate, e.target.value);
                  }}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between bg-surface-subtle p-2.5 rounded-xl border border-border-base text-xs">
              <span className="text-text-tertiary">Calculated Working Days:</span>
              <span className="font-bold text-brand font-mono">{days} {days === 1 ? "Day" : "Days"}</span>
            </div>
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
        </form>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-border-base bg-surface-subtle/50 flex items-center justify-end gap-2 shrink-0">
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
            type="button"
            size="sm"
            disabled={loading}
            onClick={handleSubmit}
            className="bg-brand text-white hover:bg-brand-hover text-xs h-9 gap-1.5 font-semibold cursor-pointer shadow-2xs"
          >
            <Send className="h-3.5 w-3.5" /> {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </div>
    </div>
  );
}
