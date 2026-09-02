"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { api, UserDraft } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { FileText, Play, Trash2 } from "lucide-react";

export function UsersDraftsDropdown() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<UserDraft[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.listUserDrafts();
      setDrafts(res.data || []);
    } catch {
      setDrafts([]);
      toast.error("Failed to load drafts");
    } finally {
      setLoading(false);
    }
  };

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const toggle = () => {
    if (!open) load();
    setOpen((o) => !o);
  };

  const continueDraft = (id: string) => {
    setOpen(false);
    router.push(`/users/create?draftId=${id}`);
  };

  const handleDelete = async (draft: UserDraft) => {
    try {
      await api.deleteUserDraft(draft.id);
      setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
      toast.success("Draft deleted");
    } catch {
      toast.error("Failed to delete draft");
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={toggle}
        className="gap-1.5 text-xs h-9"
      >
        <FileText className="h-4 w-4 text-brand" /> Drafts
        {drafts.length > 0 && (
          <span className="rounded-full bg-brand/10 px-1.5 py-0.5 font-mono text-[10px] text-brand">
            {drafts.length}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 z-50 mt-1.5 w-72 overflow-hidden rounded-lg border border-border-base bg-popover p-1 shadow-md ring-1 ring-foreground/10"
          >
            <div className="px-1.5 py-1 text-xs font-medium text-muted-foreground">
              Saved User Drafts
            </div>
            <div className="my-1 h-px bg-border" />
            <div className="max-h-72 overflow-y-auto">
              {loading ? (
                <div className="px-1.5 py-2 text-xs text-text-tertiary">Loading drafts…</div>
              ) : drafts.length === 0 ? (
                <div className="px-1.5 py-2 text-xs text-text-tertiary">No saved drafts.</div>
              ) : (
                drafts.map((d) => (
                  <div
                    key={d.id}
                    className="grid grid-cols-[minmax(0,2fr)_auto_auto] items-center gap-1 rounded-md px-1.5 py-1.5 hover:bg-accent"
                  >
                    <button
                      type="button"
                      onClick={() => continueDraft(d.id)}
                      className="flex min-w-0 flex-col text-left"
                    >
                      <span className="truncate text-xs text-text-primary" title={d.officialEmail || "Untitled draft"}>
                        {d.officialEmail || "Untitled draft"}
                      </span>
                      <span className="truncate text-[10px] text-text-tertiary">
                        Step {d.currentStep} · {new Date(d.updatedAt).toLocaleDateString()}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Continue draft ${d.officialEmail || d.id}`}
                      onClick={() => continueDraft(d.id)}
                      className="shrink-0 rounded-md p-1.5 text-brand transition-colors hover:bg-brand/10"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete draft ${d.officialEmail || d.id}`}
                      onClick={() => handleDelete(d)}
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-error/10 hover:text-error"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
