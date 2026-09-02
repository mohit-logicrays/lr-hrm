import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WizardFooterProps {
  currentStep: number;
  submitting: boolean;
  finalConfirmed: boolean;
  onPrev: () => void;
  onNext: () => void;
}

const MAX_STEP = 6;

export function WizardFooter({ currentStep, submitting, finalConfirmed, onPrev, onNext }: WizardFooterProps) {
  const isLast = currentStep === MAX_STEP;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="mt-6 flex items-center justify-between border-t border-border-base pt-4"
    >
      <Button type="button" variant="outline" size="sm" onClick={onPrev} disabled={currentStep === 1 || submitting} className="gap-1 text-xs">
        <ArrowLeft className="h-3.5 w-3.5" /> Previous
      </Button>

      {!isLast ? (
        <Button type="button" size="sm" onClick={onNext} disabled={submitting} className="gap-1 text-xs">
          Next Step <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <Button
          type="submit"
          size="sm"
          disabled={submitting || !finalConfirmed}
          className="gap-1.5 text-xs px-5"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          {submitting ? "Creating & Sending…" : "Create Employee & Send Credentials"}
        </Button>
      )}
    </motion.div>
  );
}