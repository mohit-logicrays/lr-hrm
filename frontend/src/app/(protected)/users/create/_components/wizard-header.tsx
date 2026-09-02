import { motion } from "framer-motion";
import { ArrowLeft, UserRound, Save, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WizardHeaderProps {
  autoSaving: boolean;
  draftId: string | null;
  saving: boolean;
  onSaveDraft: () => void;
  mode?: "create" | "edit";
}

export function WizardHeader({ autoSaving, draftId, saving, onSaveDraft, mode = "create" }: WizardHeaderProps) {
  const isEdit = mode === "edit";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-base pb-3">
      <div className="flex items-center gap-3">
        <Link href="/users" aria-label="Back to users list">
          <Button variant="outline" size="icon-sm" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <h1 className="flex items-center gap-2 font-heading text-xl font-bold tracking-tight text-text-primary md:text-2xl">
            <UserRound className="h-5 w-5 text-brand" />
            {isEdit ? "Edit User" : "Create New User"}
          </h1>
          <p className="text-xs text-text-tertiary">
            {isEdit
              ? "Update identity, profile, employment, and access across all 6 steps."
              : "Complete all 6 steps to configure identity, profile, employment, and access."}
          </p>
        </motion.div>
      </div>

      <div className="flex items-center gap-2">
        {!isEdit && (
          <>
            <span
              className={cn(
                "hidden items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10px] sm:flex",
                draftId
                  ? "border-brand/30 bg-brand/5 text-brand"
                  : "border-border-base text-text-tertiary"
              )}
            >
              <Sparkles className="h-3 w-3" />
              {draftId ? `Draft #${draftId.slice(0, 8)}` : "No draft yet"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onSaveDraft}
              disabled={autoSaving || saving}
              className="gap-1.5 text-xs"
            >
              {autoSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {autoSaving ? "Saving…" : "Save Draft"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}