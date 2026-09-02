"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeInUp } from "./motion";

export function TeamsPageHeader({
  canCreate,
  onCreate,
}: {
  canCreate: boolean;
  onCreate: () => void;
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
            Teams
          </h1>
          <Link href="/departments">
            <Button variant="outline" size="xs" className="gap-1 text-xs text-text-secondary h-7 px-2">
              <Building2 className="h-3.5 w-3.5" />
              Departments
            </Button>
          </Link>
        </div>
        <p className="text-xs text-text-tertiary mt-0.5">
          Manage organizational groups, team members, and departments.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {canCreate && (
          <Button
            onClick={onCreate}
            size="sm"
            className="gap-1 shadow-2xs h-8 text-xs px-3"
          >
            <Plus className="h-3.5 w-3.5" /> New Team
          </Button>
        )}
      </div>
    </motion.div>
  );
}