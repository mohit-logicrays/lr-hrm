"use client";

import { Button } from "@/components/ui/button";
import type { Pagination as PaginationMeta } from "@/lib/api";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PaginationBar({
  pagination,
  onPrev,
  onNext,
}: {
  pagination: PaginationMeta | null;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (!pagination || pagination.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-text-tertiary">
        Page {pagination.page} of {pagination.totalPages} · {pagination.total}{" "}
        total
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!pagination.hasPrevious}
          onClick={onPrev}
        >
          <ChevronLeft /> Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!pagination.hasNext}
          onClick={onNext}
        >
          Next <ChevronRight />
        </Button>
      </div>
    </div>
  );
}