"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api, type TicketCategory, type TicketPriority } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { LifeBuoy, Tag, AlertTriangle } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface CreateTicketSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTicketSheet({
  isOpen,
  onClose,
  onSuccess,
}: CreateTicketSheetProps) {
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory>("GENERAL");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill in subject and description");
      return;
    }

    try {
      setLoading(true);
      await api.createSupportTicket({
        subject,
        category,
        priority,
        description,
      });

      toast.success("Support ticket created successfully!");
      setSubject("");
      setCategory("GENERAL");
      setPriority("MEDIUM");
      setDescription("");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit support ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-xl overflow-y-auto bg-surface p-6">
        <SheetHeader className="pb-4 border-b border-border-base">
          <SheetTitle className="font-heading text-xl font-bold text-text-primary flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-brand" />
            Create Support Ticket
          </SheetTitle>
          <SheetDescription className="text-xs text-text-tertiary">
            Submit a helpdesk ticket to IT, HR, or Finance support teams.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          {/* Subject */}
          <div className="space-y-1.5">
            <label className="font-semibold text-xs text-text-primary">Subject*</label>
            <input
              type="text"
              className="w-full h-10 px-3 rounded-lg border border-border-base bg-surface text-text-primary text-xs focus:border-brand focus:outline-none"
              placeholder="Brief summary of the issue (e.g. Laptop WiFi Issue / Payroll Inquiry)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-xs text-text-primary flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-brand" /> Category*
              </label>
              <select
                className="w-full h-10 px-3 rounded-lg border border-border-base bg-surface text-text-primary text-xs focus:border-brand focus:outline-none cursor-pointer"
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
              >
                <option value="IT_HARDWARE">IT Hardware & Assets</option>
                <option value="IT_SOFTWARE">IT Software & Tools</option>
                <option value="HR_QUERY">HR & Payroll Query</option>
                <option value="PAYROLL">Reimbursement & Salary</option>
                <option value="ACCESS_REQUEST">Access & Permission Request</option>
                <option value="GENERAL">General Issue</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-xs text-text-primary flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-brand" /> Priority*
              </label>
              <select
                className="w-full h-10 px-3 rounded-lg border border-border-base bg-surface text-text-primary text-xs focus:border-brand focus:outline-none cursor-pointer"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-xs text-text-primary">Description & Details*</label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Describe the issue, error messages, or request in detail..."
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-border-base flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-brand hover:bg-brand/90 text-white font-bold" disabled={loading}>
              {loading ? "Submitting..." : "Submit Ticket"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
