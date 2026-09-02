"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepMeta {
  id: number;
  label: string;
  desc: string;
}

interface WizardStepperProps {
  steps: StepMeta[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
}

export function WizardStepper({ steps, currentStep, onStepClick }: WizardStepperProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      {steps.map((s) => {
        const isDone = s.id < currentStep;
        const isCurrent = s.id === currentStep;

        return (
          <motion.div
            key={s.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (s.id < currentStep) onStepClick(s.id);
            }}
            className={cn(
              "flex flex-col p-2.5 rounded-lg border transition-all cursor-pointer select-none relative overflow-hidden",
              isCurrent
                ? "bg-brand/10 border-brand/40 text-brand shadow-2xs"
                : isDone
                ? "bg-surface-subtle border-border-base text-success hover:border-success/30"
                : "bg-surface border-border-base text-text-tertiary opacity-70"
            )}
          >
            {isCurrent && (
              <motion.div
                layoutId="activeStepGlow"
                className="absolute inset-0 bg-brand/5 border-l-2 border-brand pointer-events-none"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}

            <div className="flex items-center justify-between mb-1 z-10">
              <span className="text-[10px] font-mono font-bold">STEP 0{s.id}</span>
              {isDone ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              ) : isCurrent ? (
                <span className="h-2 w-2 rounded-full bg-brand animate-ping" />
              ) : null}
            </div>

            <span className="font-semibold text-xs font-heading line-clamp-1 z-10">{s.label}</span>
            <span className="text-[9px] text-text-tertiary line-clamp-1 z-10">{s.desc}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
