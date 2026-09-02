"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api, type PolicyCategory } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollText, Tag, Link as LinkIcon, ShieldCheck } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface CreatePolicySheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePolicySheet({
  isOpen,
  onClose,
  onSuccess,
}: CreatePolicySheetProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState<PolicyCategory>("HR");
  const [version, setVersion] = useState("v2026.1");
  const [content, setContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [isMandatory, setIsMandatory] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please enter policy title and content");
      return;
    }

    try {
      setLoading(true);
      await api.createPolicy({
        title,
        code: code || null,
        category,
        version,
        content,
        fileUrl: fileUrl || null,
        isMandatory,
      });

      toast.success("Policy created successfully");
      setTitle("");
      setCode("");
      setCategory("HR");
      setVersion("v2026.1");
      setContent("");
      setFileUrl("");
      setIsMandatory(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create policy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-xl overflow-y-auto bg-surface p-6">
        <SheetHeader className="pb-4 border-b border-border-base">
          <SheetTitle className="font-heading text-xl font-bold text-text-primary flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-brand" />
            Add Company Policy
          </SheetTitle>
          <SheetDescription className="text-xs text-text-tertiary">
            Create standard operating procedures, compliance guidelines, and HR policies.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          {/* Policy Title */}
          <div className="space-y-1.5">
            <label className="font-semibold text-xs text-text-primary">Policy Name*</label>
            <input
              type="text"
              className="w-full h-10 px-3 rounded-lg border border-border-base bg-surface text-text-primary text-xs focus:border-brand focus:outline-none"
              placeholder="e.g. Leave Policy 2026 / Remote Work Guidelines"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Category & Version */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-xs text-text-primary flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-brand" /> Category
              </label>
              <select
                className="w-full h-10 px-3 rounded-lg border border-border-base bg-surface text-text-primary text-xs focus:border-brand focus:outline-none cursor-pointer"
                value={category}
                onChange={(e) => setCategory(e.target.value as PolicyCategory)}
              >
                <option value="HR">HR Policy</option>
                <option value="IT">IT & Cyber Security</option>
                <option value="FINANCE">Finance & Travel</option>
                <option value="SECURITY">Data Protection & Privacy</option>
                <option value="GENERAL">General Guidelines</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-xs text-text-primary">Version</label>
              <input
                type="text"
                className="w-full h-10 px-3 rounded-lg border border-border-base bg-surface text-text-primary text-xs focus:border-brand focus:outline-none"
                placeholder="v1.0 / v2026.1"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
              />
            </div>
          </div>

          {/* Policy Code */}
          <div className="space-y-1.5">
            <label className="font-semibold text-xs text-text-primary">Policy Reference Code (Optional)</label>
            <input
              type="text"
              className="w-full h-10 px-3 rounded-lg border border-border-base bg-surface text-text-primary text-xs focus:border-brand focus:outline-none font-mono"
              placeholder="e.g. POL-HR-001"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          {/* Policy Content Editor */}
          <div className="space-y-1.5">
            <label className="font-semibold text-xs text-text-primary">Policy Content & Clauses*</label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Write detailed policy rules, eligibility, procedures..."
            />
          </div>

          {/* File URL / Document Attachment */}
          <div className="space-y-1.5">
            <label className="font-semibold text-xs text-text-primary flex items-center gap-1">
              <LinkIcon className="h-3.5 w-3.5 text-brand" /> PDF Document Link (Optional)
            </label>
            <input
              type="url"
              className="w-full h-10 px-3 rounded-lg border border-border-base bg-surface text-text-primary text-xs focus:border-brand focus:outline-none font-mono"
              placeholder="https://.../policy.pdf"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
            />
          </div>

          {/* Mandatory Acknowledgment Toggle */}
          <div className="p-3.5 rounded-xl border border-border-base bg-surface-subtle/40 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-xs text-text-primary flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-brand" /> Require Employee Acknowledgment
              </span>
              <p className="text-[11px] text-text-tertiary">Employees must read and click "I Acknowledge".</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border-base text-brand focus:ring-brand accent-brand cursor-pointer"
              checked={isMandatory}
              onChange={(e) => setIsMandatory(e.target.checked)}
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-border-base flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-brand hover:bg-brand/90 text-white font-bold" disabled={loading}>
              {loading ? "Saving..." : "Add Policy"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
