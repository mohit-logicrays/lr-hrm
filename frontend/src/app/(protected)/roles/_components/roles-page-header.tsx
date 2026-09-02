"use client";

import { motion } from "framer-motion";
import { Download, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fadeInUp } from "./motion";

export function RolesPageHeader({
  roleCount,
  canManage,
  onExport,
  onAddRole,
}: {
  roleCount: number;
  canManage: boolean;
  onExport: () => void;
  onAddRole: () => void;
}) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
    >
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-text-primary md:text-2xl font-heading">
            Roles &amp; Permissions
          </h1>
          <Badge variant="outline" className="text-xs font-normal">
            {roleCount} Roles Configured
          </Badge>
        </div>
        <p className="text-xs text-text-tertiary mt-0.5">
          Manage organizational access levels and define capabilities for all users.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="gap-1 text-xs h-8 px-3 shadow-2xs"
        >
          <Download className="h-3.5 w-3.5" /> Export
        </Button>

        {canManage && (
          <Button
            onClick={onAddRole}
            size="sm"
            className="gap-1 shadow-2xs h-8 text-xs px-3"
          >
            <Plus className="h-3.5 w-3.5" /> Add New Role
          </Button>
        )}
      </div>
    </motion.div>
  );
}