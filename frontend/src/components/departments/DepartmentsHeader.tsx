"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface DepartmentsHeaderProps {
  totalCount: number;
  canCreate: boolean;
  onAddClick: () => void;
}

export function DepartmentsHeader({
  totalCount,
  canCreate,
  onAddClick,
}: DepartmentsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl font-heading flex items-center gap-3">
          Departments
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            key={totalCount}
            className="text-xs font-semibold bg-brand/10 text-brand px-2.5 py-1 rounded-full font-mono"
          >
            {totalCount}
          </motion.span>
        </h1>
        <p className="text-xs text-text-tertiary mt-1">
          Manage departments, teams, and employee allocations across the organization.
        </p>
      </div>

      {canCreate && (
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            size="sm"
            onClick={onAddClick}
            className="gap-1.5 text-xs h-9 shadow-2xs bg-brand hover:bg-brand-hover text-white font-medium"
          >
            <Plus className="h-4 w-4" /> Add New Department
          </Button>
        </motion.div>
      )}
    </div>
  );
}
