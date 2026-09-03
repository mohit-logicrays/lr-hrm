"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api, type Announcement, type AnnouncementCategory, type AnnouncementStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Megaphone, Calendar, Tag, AlertTriangle, Pin } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface CreateAnnouncementSheetProps {
  isOpen: boolean;
  initialData?: Announcement | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateAnnouncementSheet({
  isOpen,
  initialData,
  onClose,
  onSuccess,
}: CreateAnnouncementSheetProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<AnnouncementCategory>("GENERAL");
  const [priority, setPriority] = useState<"NORMAL" | "HIGH" | "URGENT">("NORMAL");
  const [isPinned, setIsPinned] = useState(false);
  const [status, setStatus] = useState<AnnouncementStatus>("ACTIVE");
  const [expiryDate, setExpiryDate] = useState("");

  useEffect(() => {
    if (initialData && isOpen) {
      setTitle(initialData.title || "");
      setContent(initialData.content || "");
      setCategory(initialData.category || "GENERAL");
      setPriority(initialData.priority || "NORMAL");
      setIsPinned(Boolean(initialData.isPinned));
      setStatus(initialData.status || "ACTIVE");
      setExpiryDate(
        initialData.expiryDate
          ? new Date(initialData.expiryDate).toISOString().split("T")[0]
          : ""
      );
    } else if (!initialData && isOpen) {
      setTitle("");
      setContent("");
      setCategory("GENERAL");
      setPriority("NORMAL");
      setIsPinned(false);
      setStatus("ACTIVE");
      setExpiryDate("");
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in both title and content");
      return;
    }

    try {
      setLoading(true);
      if (initialData) {
        await api.updateAnnouncement(initialData.id, {
          title,
          content,
          category,
          priority,
          isPinned,
          status,
          expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
        });
        toast.success("Announcement updated successfully");
      } else {
        await api.createAnnouncement({
          title,
          content,
          category,
          priority,
          isPinned,
          status,
          expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
        });
        toast.success("Announcement created successfully");
      }
      setTitle("");
      setContent("");
      setCategory("GENERAL");
      setPriority("NORMAL");
      setIsPinned(false);
      setStatus("ACTIVE");
      setExpiryDate("");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create announcement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-xl overflow-y-auto bg-surface p-6">
        <SheetHeader className="pb-4 border-b border-border-base">
          <SheetTitle className="font-heading text-xl font-bold text-text-primary flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-brand" />
            {initialData ? "Edit Announcement" : "New Announcement"}
          </SheetTitle>
          <SheetDescription className="text-xs text-text-tertiary">
            {initialData
              ? "Update announcement details, priority, or expiration."
              : "Publish company-wide announcements, policy updates, or urgent alerts."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="font-semibold text-xs text-text-primary">Announcement Title*</label>
            <input
              type="text"
              className="w-full h-10 px-3 rounded-lg border border-border-base bg-surface text-text-primary text-xs focus:border-brand focus:outline-none"
              placeholder="e.g. Q4 Townhall Meeting Scheduled"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-xs text-text-primary flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-brand" /> Category
              </label>
              <select
                className="w-full h-10 px-3 rounded-lg border border-border-base bg-surface text-text-primary text-xs focus:border-brand focus:outline-none cursor-pointer"
                value={category}
                onChange={(e) => setCategory(e.target.value as AnnouncementCategory)}
              >
                <option value="GENERAL">General</option>
                <option value="HR">HR & Culture</option>
                <option value="EVENTS">Events & Meetings</option>
                <option value="IT_INFRA">IT & Infrastructure</option>
                <option value="URGENT">Urgent Alert</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-xs text-text-primary flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-brand" /> Priority
              </label>
              <select
                className="w-full h-10 px-3 rounded-lg border border-border-base bg-surface text-text-primary text-xs focus:border-brand focus:outline-none cursor-pointer"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
              >
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Content Editor */}
          <div className="space-y-1.5">
            <label className="font-semibold text-xs text-text-primary">Announcement Body*</label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Write announcement details..."
            />
          </div>

          {/* Expiry Date & Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-xs text-text-primary flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-brand" /> Expiry Date (Optional)
              </label>
              <input
                type="date"
                className="w-full h-10 px-3 rounded-lg border border-border-base bg-surface text-text-primary text-xs focus:border-brand focus:outline-none"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-xs text-text-primary">Status</label>
              <select
                className="w-full h-10 px-3 rounded-lg border border-border-base bg-surface text-text-primary text-xs focus:border-brand focus:outline-none cursor-pointer"
                value={status}
                onChange={(e) => setStatus(e.target.value as AnnouncementStatus)}
              >
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>

          {/* Pin to Top */}
          <div className="p-3.5 rounded-xl border border-border-base bg-surface-subtle/40 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-xs text-text-primary flex items-center gap-1.5">
                <Pin className="h-3.5 w-3.5 text-brand" /> Pin to Top
              </span>
              <p className="text-[11px] text-text-tertiary">Keep this announcement at the top of employee feeds.</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border-base text-brand focus:ring-brand accent-brand cursor-pointer"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-border-base flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-brand hover:bg-brand/90 text-white font-bold" disabled={loading}>
              {loading ? "Saving..." : initialData ? "Save Changes" : "Publish Announcement"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
