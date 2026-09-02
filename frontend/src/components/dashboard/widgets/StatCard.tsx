import { motion, type Variants } from "framer-motion";
import { Card } from "@/components/ui/card";

export interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  trend?: string;
  trendUp?: boolean;
  color?: string;
  bg?: string;
  variants?: Variants;
}

/**
 * Reusable KPI stat card used across all role dashboards.
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  trendUp = true,
  color = "text-brand",
  bg = "bg-brand/10",
  variants,
}: StatCardProps) {
  return (
    <motion.div variants={variants}>
      <Card className="p-5 bg-surface border border-border-base rounded-2xl shadow-2xs hover:shadow-md transition-all hover:-translate-y-0.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-widest mb-1 truncate">
              {label}
            </p>
            <p className="text-2xl font-extrabold text-text-primary font-heading leading-none">
              {value}
            </p>
            {sub && (
              <p className="text-xs text-text-tertiary mt-1">{sub}</p>
            )}
            {trend && (
              <p className={`text-[10px] font-semibold mt-1.5 ${trendUp ? "text-success" : "text-error"}`}>
                {trendUp ? "↑" : "↓"} {trend}
              </p>
            )}
          </div>
          <div className={`${bg} p-3 rounded-xl shrink-0`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
