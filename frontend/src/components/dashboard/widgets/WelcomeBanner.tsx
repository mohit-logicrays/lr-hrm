import { motion, type Variants } from "framer-motion";
import { Sun, Shield } from "lucide-react";

const QUOTES = [
  "Great things in business are never done by one person.",
  "The secret of getting ahead is getting started.",
  "Quality is not an act, it is a habit.",
  "Innovation distinguishes between a leader and a follower.",
  "Success is the sum of small efforts, repeated day in and day out.",
  "Hard work beats talent when talent doesn't work hard.",
  "The only way to do great work is to love what you do.",
];

export interface WelcomeBannerProps {
  firstName: string;
  /** Override quote. If omitted, picks from daily rotation. */
  quote?: string;
  /** Use Shield icon instead of Sun (for superadmin). */
  variant?: "default" | "admin";
  variants?: Variants;
}

/**
 * Welcome header with motivational quote.
 * Used at the top of every role dashboard.
 */
export function WelcomeBanner({
  firstName,
  quote,
  variant = "default",
  variants,
}: WelcomeBannerProps) {
  const resolvedQuote = quote ?? QUOTES[new Date().getDay() % QUOTES.length];
  const IconComponent = variant === "admin" ? Shield : Sun;
  const iconClass = variant === "admin" ? "text-brand" : "text-yellow-400";

  return (
    <motion.div variants={variants} className="flex flex-col gap-1">
      <div className="flex items-center gap-2.5">
        <IconComponent className={`h-6 w-6 ${iconClass}`} />
        <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
          Welcome back, {firstName}!
        </h1>
      </div>
      <p className="text-sm text-text-tertiary italic pl-9">"{resolvedQuote}"</p>
    </motion.div>
  );
}
