"use client";

import { useState, FormEvent, useEffect } from "react";
import { toast } from "sonner";
import { api, type Holiday, type HolidayType } from "@/lib/api";
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
import { Calendar, Save } from "lucide-react";

interface AddEditHolidaySheetProps {
  holiday: Holiday | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddEditHolidaySheet({
  holiday,
  isOpen,
  onClose,
  onSuccess,
}: AddEditHolidaySheetProps) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<HolidayType>("NATIONAL");
  const [isOptional, setIsOptional] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (holiday) {
      setName(holiday.name);
      setDate(holiday.date.split("T")[0]);
      setType(holiday.type || "NATIONAL");
      setIsOptional(Boolean(holiday.isOptional));
      setDescription(holiday.description || "");
    } else {
      setName("");
      setDate("");
      setType("NATIONAL");
      setIsOptional(false);
      setDescription("");
    }
  }, [holiday, isOpen]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Holiday name is required");
      return;
    }
    if (!date) {
      toast.error("Date is required");
      return;
    }

    setSubmitting(true);
    try {
      if (holiday) {
        await api.updateHoliday(holiday.id, {
          name,
          date,
          type,
          isOptional,
          description,
        });
        toast.success("Holiday updated successfully");
      } else {
        await api.createHoliday({
          name,
          date,
          type,
          isOptional,
          description,
        });
        toast.success("Holiday created successfully");
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save holiday");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md w-full bg-surface p-0 flex flex-col h-full border-l border-border-base">
        {/* Header */}
        <SheetHeader className="p-6 border-b border-border-base bg-surface-subtle/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shadow-2xs font-bold">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="font-heading text-lg font-bold text-text-primary">
                {holiday ? "Edit Holiday" : "Add Holiday"}
              </SheetTitle>
              <SheetDescription className="text-xs text-text-tertiary">
                {holiday
                  ? "Modify existing company holiday entry"
                  : "Create a new holiday entry for the company calendar"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Holiday Name */}
          <div className="space-y-1">
            <Label htmlFor="holiday-name" className="text-xs font-semibold text-text-primary">
              Holiday Name *
            </Label>
            <Input
              id="holiday-name"
              required
              className="text-xs h-9"
              placeholder="e.g. Independence Day, Diwali, Republic Day"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Date Picker */}
          <div className="space-y-1">
            <Label htmlFor="holiday-date" className="text-xs font-semibold text-text-primary">
              Date *
            </Label>
            <Input
              id="holiday-date"
              type="date"
              required
              className="text-xs h-9"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Holiday Type */}
          <div className="space-y-1">
            <Label htmlFor="holiday-type" className="text-xs font-semibold text-text-primary">
              Type *
            </Label>
            <select
              id="holiday-type"
              className="w-full h-9 rounded-md border border-border-base bg-surface px-3 text-xs font-medium text-text-primary focus:border-brand focus:outline-none"
              value={type}
              onChange={(e) => setType(e.target.value as HolidayType)}
            >
              <option value="NATIONAL">National Holiday</option>
              <option value="RESTRICTED">Restricted (Floating) Holiday</option>
              <option value="COMPANY">Company Event</option>
            </select>
          </div>

          {/* Optional Holiday Custom Toggle Card */}
          <div className="flex items-center justify-between p-3 bg-surface-subtle/40 rounded-lg border border-border-base">
            <div>
              <Label htmlFor="optional-toggle" className="text-xs font-semibold text-text-primary cursor-pointer">
                Optional Holiday
              </Label>
              <p className="text-[11px] text-text-tertiary">
                Employees can choose whether to take this day off.
              </p>
            </div>
            <input
              type="checkbox"
              id="optional-toggle"
              checked={isOptional}
              onChange={(e) => setIsOptional(e.target.checked)}
              className="h-4 w-4 rounded border-border-base text-brand focus:ring-brand cursor-pointer"
            />
          </div>

          {/* Tiptap Rich Text Description */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-text-primary">
              Description (Rich Text / Tiptap)
            </Label>
            <RichTextEditor
              value={description}
              onChange={(val) => setDescription(val)}
              placeholder="Add details, policies, or context for this holiday..."
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
              className="bg-brand hover:bg-brand-hover text-white font-semibold gap-1.5"
            >
              <Save className="h-4 w-4" />
              {submitting ? "Saving..." : "Save Holiday"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
