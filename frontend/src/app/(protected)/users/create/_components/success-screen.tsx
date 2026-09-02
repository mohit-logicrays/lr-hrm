"use client";

import { motion } from "framer-motion";
import { Check, Mail, UserRoundPlus, RefreshCcw, LayoutList } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface SuccessScreenProps {
  email: string;
  onReset: () => void;
}

export function SuccessScreen({ email, onReset }: SuccessScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col items-center py-10 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.1 }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-success/15"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.25 }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-success"
        >
          <Check className="h-7 w-7 text-white" strokeWidth={3} />
        </motion.div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-6 font-heading text-2xl font-bold text-text-primary"
      >
        Employee Created Successfully!
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mt-3 flex max-w-md flex-col items-center gap-3"
      >
        <p className="text-sm text-text-secondary">
          The account has been created and temporary credentials have been sent to:
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1.5 font-mono text-xs font-medium text-brand">
          <Mail className="h-3.5 w-3.5" />
          {email || "the employee's email address"}
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-3"
      >
        <Button onClick={onReset} variant="outline" className="gap-2 text-xs">
          <UserRoundPlus className="h-4 w-4" /> Create Another Employee
        </Button>
        <Button asChild className="gap-2 text-xs">
          <Link href="/users">
            <LayoutList className="h-4 w-4" /> View All Employees
          </Link>
        </Button>
        <span className="flex items-center gap-1 text-[11px] text-text-tertiary">
          <RefreshCcw className="h-3 w-3" /> Tip: you can also use this wizard for future onboarding
        </span>
      </motion.div>
    </motion.div>
  );
}