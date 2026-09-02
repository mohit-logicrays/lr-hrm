import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-[11px] text-error animate-in fade-in slide-in-from-top-1 duration-150">
      <AlertCircle className="h-3 w-3 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

interface FieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

/** Wraps an input with Label + hint + inline validation error. */
export function Field({ label, required, error, hint, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {label ? (
        <label className="flex items-center gap-1 text-xs font-semibold text-text-primary">
          {label}
          {required ? <span className="text-brand">*</span> : null}
        </label>
      ) : null}
      {children}
      <FieldError message={error} />
      {hint && !error ? <p className="text-[10px] text-text-tertiary">{hint}</p> : null}
    </div>
  );
}