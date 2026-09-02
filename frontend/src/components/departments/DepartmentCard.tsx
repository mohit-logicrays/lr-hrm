"use client";

import { motion } from "framer-motion";
import { Department } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Brain,
  Building2,
  Code,
  Cpu,
  Globe,
  Layers,
  MoreVertical,
  Palette,
  Pencil,
  Server,
  ShoppingBag,
  ShoppingCart,
  Terminal,
  Trash2,
  Users,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DepartmentCardProps {
  department: Department;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (d: Department) => void;
  onDelete: (d: Department) => void;
}

// Icon and theme mapping based on department code/name
function getDepartmentTheme(name: string, code: string) {
  const key = `${name} ${code}`.toLowerCase();

  if (key.includes("py") || key.includes("python")) {
    return {
      icon: Code,
      bg: "bg-blue-100 dark:bg-blue-950/40",
      text: "text-blue-600 dark:text-blue-400",
    };
  }
  if (key.includes("ai") || key.includes("ml") || key.includes("data")) {
    return {
      icon: Brain,
      bg: "bg-purple-100 dark:bg-purple-950/40",
      text: "text-purple-600 dark:text-purple-400",
    };
  }
  if (key.includes("shop") || key.includes("ecom") || key.includes("cart")) {
    return {
      icon: ShoppingCart,
      bg: "bg-orange-100 dark:bg-orange-950/40",
      text: "text-orange-600 dark:text-orange-400",
    };
  }
  if (key.includes("front") || key.includes("fe") || key.includes("react")) {
    return {
      icon: Terminal,
      bg: "bg-cyan-100 dark:bg-cyan-950/40",
      text: "text-cyan-600 dark:text-cyan-400",
    };
  }
  if (key.includes("back") || key.includes("be") || key.includes("node")) {
    return {
      icon: Server,
      bg: "bg-indigo-100 dark:bg-indigo-950/40",
      text: "text-indigo-600 dark:text-indigo-400",
    };
  }
  if (key.includes("devops") || key.includes("cloud") || key.includes("sys")) {
    return {
      icon: Cpu,
      bg: "bg-red-100 dark:bg-red-950/40",
      text: "text-red-600 dark:text-red-400",
    };
  }
  if (key.includes("design") || key.includes("ui") || key.includes("ux")) {
    return {
      icon: Palette,
      bg: "bg-pink-100 dark:bg-pink-950/40",
      text: "text-pink-600 dark:text-pink-400",
    };
  }
  if (key.includes("qa") || key.includes("test")) {
    return {
      icon: CheckCircle2,
      bg: "bg-teal-100 dark:bg-teal-950/40",
      text: "text-teal-600 dark:text-teal-400",
    };
  }

  return {
    icon: Building2,
    bg: "bg-brand/10",
    text: "text-brand",
  };
}

export function DepartmentCard({
  department,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: DepartmentCardProps) {
  const theme = getDepartmentTheme(department.name, department.code);
  const IconComponent = theme.icon;

  const teamsCount = department._count?.teams ?? 0;
  const usersCount = department._count?.users ?? 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-surface rounded-xl p-5 border border-border-base shadow-2xs hover:shadow-md hover:border-brand/30 transition-all flex flex-col justify-between group relative"
    >
      {/* Top Card Header */}
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3.5">
            <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center shrink-0", theme.bg, theme.text)}>
              <IconComponent className="h-6 w-6" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-bold text-base text-text-primary font-heading line-clamp-1">
                  {department.name}
                </h3>
                <span className="bg-surface-subtle text-text-secondary text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border border-border-base">
                  DPT-{department.code}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-success bg-success/10 px-2 py-0.5 rounded-full font-semibold text-[10px] border border-success/20">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Active
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7 text-text-tertiary hover:text-text-primary opacity-80 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 text-xs">
              {canUpdate && (
                <DropdownMenuItem onClick={() => onEdit(department)}>
                  <Pencil className="h-3.5 w-3.5 mr-2" /> Edit Details
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(department)}
                    className="text-error focus:text-error"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Department
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {department.description && (
          <p className="text-xs text-text-tertiary line-clamp-2 mb-4 leading-relaxed">
            {department.description}
          </p>
        )}
      </div>

      {/* Bottom Footer Details */}
      <div className="flex justify-between items-end pt-4 border-t border-border-base/50 mt-auto">
        <div className="flex gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-normal text-text-tertiary mb-0.5">Teams</span>
            <span className="font-bold text-sm text-text-primary font-heading">{teamsCount}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-normal text-text-tertiary mb-0.5">Employees</span>
            <span className="font-bold text-sm text-text-primary font-heading">{usersCount}</span>
          </div>
        </div>

        {/* User Avatars Preview */}
        <div className="flex items-center -space-x-2">
          <div className="w-6 h-6 rounded-full bg-brand/10 text-brand border-2 border-surface flex items-center justify-center text-[9px] font-mono font-bold">
            LR
          </div>
          <div className="w-6 h-6 rounded-full bg-surface-subtle text-text-primary border-2 border-surface flex items-center justify-center text-[9px] font-mono font-bold">
            FE
          </div>
          <div className="w-6 h-6 rounded-full bg-surface-subtle text-text-primary border-2 border-surface flex items-center justify-center text-[9px] font-mono font-bold">
            BE
          </div>
          <span className="text-[10px] font-bold font-mono text-text-tertiary pl-3">
            +{usersCount > 3 ? usersCount - 3 : usersCount}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
