"use client";

import { motion, type Variants } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export interface CriticalAlert {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  count: number;
}

export interface CriticalAlertsWidgetProps {
  alerts: CriticalAlert[];
  variants?: Variants;
}

/**
 * A compact card that lists critical system alerts.
 * Used on Superadmin dashboard. Data-driven — just pass alerts[].
 */
export function CriticalAlertsWidget({ alerts, variants }: CriticalAlertsWidgetProps) {
  const hasAlerts = alerts.length > 0 && alerts.some((a) => a.count > 0);

  return (
    <motion.div variants={variants}>
      <Card className="p-6 bg-surface border border-border-base rounded-2xl shadow-2xs">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-error" />
          <h2 className="font-heading font-bold text-base text-text-primary">Critical Alerts</h2>
        </div>

        {!hasAlerts ? (
          <div className="flex flex-col items-center gap-2 py-5">
            <CheckCircle2 className="h-8 w-8 text-success opacity-70" />
            <p className="text-xs text-text-tertiary">No critical alerts</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.filter((a) => a.count > 0).map((alert) => (
              <div
                key={alert.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-error/5 border border-error/20"
              >
                <alert.icon className="h-4 w-4 text-error shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-text-primary">{alert.title}</p>
                  <p className="text-[10px] text-text-tertiary">{alert.description}</p>
                </div>
                <Badge className="bg-error/10 text-error border-error/30 text-[10px] shrink-0 ml-auto">
                  {alert.count}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
