"use client";

import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone } from "lucide-react";
import { api, type Announcement } from "@/lib/api";

export interface AnnouncementsWidgetProps {
  limit?: number;
  variants?: Variants;
}

/**
 * Shows a compact list of recent active announcements.
 * Used on Member, HR, and Superadmin dashboards.
 */
export function AnnouncementsWidget({ limit = 5, variants }: AnnouncementsWidgetProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listAnnouncements(1, limit, { status: "ACTIVE" })
      .then((res) => setAnnouncements(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [limit]);

  return (
    <motion.div variants={variants} className="h-full">
      <Card className="p-6 bg-surface border border-border-base rounded-2xl shadow-2xs h-full">
        <div className="flex items-center gap-2 mb-5">
          <Megaphone className="h-5 w-5 text-brand" />
          <h2 className="font-heading font-bold text-base text-text-primary">Recent Announcements</h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-surface-subtle rounded-xl animate-pulse" />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <Megaphone className="h-7 w-7 text-text-tertiary opacity-40" />
            <p className="text-sm text-text-tertiary">No announcements yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-surface-subtle hover:bg-surface-container transition-colors"
              >
                <div className="bg-brand/10 rounded-lg p-2 mt-0.5 shrink-0">
                  <Megaphone className="h-3.5 w-3.5 text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-text-primary line-clamp-1">{ann.title}</p>
                  <p className="text-[10px] text-text-tertiary mt-0.5">
                    {new Date(ann.publishDate).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                {ann.priority === "URGENT" && (
                  <Badge className="bg-error/10 text-error border-error/30 text-[10px] shrink-0">
                    Urgent
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
