"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationPaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function NotificationPagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
}: NotificationPaginationProps) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end   = Math.min(page * pageSize, totalCount);

  // Centred window of up to 4 page numbers (matches reference: 1 2 3 4)
  function getPageNumbers(): number[] {
    const delta = 2;
    const pages: number[] = [];
    for (
      let i = Math.max(1, page - delta);
      i <= Math.min(totalPages, page + delta);
      i++
    ) {
      pages.push(i);
    }
    return pages;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-border-base">
      {/* "Showing X to Y of Z notifications" — matches reference text exactly */}
      <p className="text-sm text-text-secondary">
        Showing{" "}
        <span className="font-bold text-text-primary">{start} to {end}</span>
        {" "}of{" "}
        <span className="font-bold text-text-primary">{totalCount}</span>
        {" "}notifications
      </p>

      <div className="flex items-center gap-2">
        {/* Previous */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            page <= 1
              ? "bg-surface-subtle text-text-tertiary cursor-not-allowed"
              : "bg-surface-subtle text-text-primary hover:bg-border-base cursor-pointer"
          )}
        >
          Previous
        </button>

        {getPageNumbers().map((pg) => (
          <button
            key={pg}
            type="button"
            onClick={() => onPageChange(pg)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
              pg === page
                ? "bg-brand text-white shadow-2xs"
                : "bg-surface-subtle text-text-primary hover:bg-border-base"
            )}
          >
            {pg}
          </button>
        ))}

        {/* Next */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-2xs",
            page >= totalPages
              ? "bg-surface-subtle text-text-tertiary cursor-not-allowed"
              : "bg-surface-subtle text-text-primary hover:bg-border-base cursor-pointer"
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
}
