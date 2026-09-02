import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { STEPS } from "./types";
import { cn } from "@/lib/utils";

interface WizardStepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function WizardStepper({ currentStep, onStepClick }: WizardStepperProps) {
  const progress = ((currentStep - 1) / STEPS.length) * 100;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {STEPS.map((s) => {
          const isDone = s.id < currentStep;
          const isCurrent = s.id === currentStep;

          return (
            <motion.button
              key={s.id}
              type="button"
              onClick={() => isDone && onStepClick(s.id)}
              whileHover={isDone ? { y: -1 } : undefined}
              className={cn(
                "flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-colors",
                isCurrent
                  ? "border-brand/40 bg-brand/10 text-brand"
                  : isDone
                    ? "cursor-pointer border-border-base bg-surface text-text-primary hover:border-success/30"
                    : "border-border-base bg-surface/60 text-text-tertiary"
              )}
            >
              <span className="flex w-full items-center justify-between">
                <span className="font-mono text-[10px] font-bold">STEP 0{s.id}</span>
                {isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                ) : isCurrent ? (
                  <motion.span
                    key={`dot-${currentStep}`}
                    className="h-2 w-2 rounded-full bg-brand"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-border-base" />
                )}
              </span>
              <span className="line-clamp-1 text-xs font-semibold font-heading">{s.label}</span>
              <span className="line-clamp-1 text-[9px] text-text-tertiary">{s.desc}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-surface-subtle">
        <motion.div
          className="h-full rounded-full bg-brand"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </div>
  );
}