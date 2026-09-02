"use client";

import { motion, type Variants } from "framer-motion";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export interface TodayOverviewItem {
  value: string | number;
  label: string;
  color: string;
  borderColor: string;
}

export interface TodayOverviewWidgetProps {
  items: TodayOverviewItem[];
  title?: string;
  variants?: Variants;
}

/**
 * 3-column summary grid showing key metrics for today.
 * Fully data-driven — just pass the items array.
 */
export function TodayOverviewWidget({
  items,
  title = "Today's Overview",
  variants,
}: TodayOverviewWidgetProps) {
  return (
    <motion.div variants={variants}>
      <Card className="p-6 bg-surface border border-border-base rounded-2xl shadow-2xs">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="h-5 w-5 text-success" />
          <h2 className="font-heading font-bold text-base text-text-primary">{title}</h2>
        </div>
        <div className={`grid grid-cols-1 gap-4 text-center md:grid-cols-${Math.min(items.length, 4)}`}>
          {items.map((item) => (
            <div
              key={item.label}
              className={`p-4 rounded-xl border ${item.borderColor} ${item.color.replace("text-", "bg-")}/5`}
            >
              <p className={`text-3xl font-extrabold font-heading ${item.color}`}>{item.value}</p>
              <p className="text-xs text-text-tertiary mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
