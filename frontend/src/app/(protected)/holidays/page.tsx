"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import { toast } from "sonner";
import { api, Holiday } from "@/lib/api";
import { usePermission } from "@/providers/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarPlus, Pencil, Plus, Search, Trash2 } from "lucide-react";

export default function HolidaysPage() {
  const perms = usePermission("holiday");
  const [result, setResult] = useState<{ data: Holiday[]; total: number; totalPages: number } | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<"create" | { edit: Holiday } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.listHolidays(page, 10, year ? Number(year) : undefined, search);
      setResult({ data: res.data, total: res.pagination.total, totalPages: res.pagination.totalPages });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load holidays");
    } finally {
      setLoading(false);
    }
  }, [page, search, year]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(h: Holiday) {
    if (!window.confirm(`Delete holiday "${h.name}"?`)) return;
    try {
      await api.deleteHoliday(h.id);
      toast.success("Holiday deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete holiday");
    }
  }

  const years = Array.from(new Set([new Date().getFullYear(), ...(result?.data.map((h) => h.year) ?? [])])).sort();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Holidays"
        subtitle={result ? `${result.total} holidays` : "Company holidays and observances"}
        actions={
          perms.manage ? (
            <Button onClick={() => setDialog("create")}>
              <CalendarPlus /> Add holiday
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <Input
            className="pl-9"
            placeholder="Search holidays…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <input
          aria-label="Year"
          type="number"
          min={2000}
          max={2100}
          className="h-10 w-24 rounded-md border border-border-base bg-surface px-3 text-sm"
          placeholder="Year"
          value={year}
          onChange={(e) => {
            setPage(1);
            setYear(e.target.value);
          }}
        />
      </div>

      <div className="rounded-lg border border-border-base bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              result?.data.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.name}</TableCell>
                  <TableCell className="text-text-secondary">
                    {new Date(h.date).toLocaleDateString(undefined, {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-text-secondary">{h.year}</TableCell>
                  <TableCell>
                    <Badge className={h.isOptional ? "bg-warning-light text-warning" : "bg-info-light text-info"}>
                      {h.isOptional ? "Optional" : "Mandatory"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {perms.manage && (
                        <>
                          <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => setDialog({ edit: h })}>
                            <Pencil />
                          </Button>
                          <Button variant="ghost" size="icon-sm" aria-label="Delete" className="text-muted-foreground hover:text-error" onClick={() => remove(h)}>
                            <Trash2 />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {years.length > 1 && (
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <Plus className="h-3 w-3" />
          {years.map((y) => y).join(" · ")}
        </div>
      )}

      <PaginationBar
        pagination={result ? { total: result.total, page, pageSize: 10, totalPages: result.totalPages, hasPrevious: page > 1, hasNext: page < result.totalPages, previous: page > 1 ? page - 1 : null, next: page < result.totalPages ? page + 1 : null } : null}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => p + 1)}
      />

      {dialog && (
        <HolidayDialog
          holiday={dialog === "create" ? null : (dialog as { edit: Holiday }).edit}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function HolidayDialog({
  holiday,
  onClose,
  onSaved,
}: {
  holiday: Holiday | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    name: holiday?.name ?? "",
    date: holiday?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    isOptional: holiday?.isOptional ?? false,
  }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.date) return;
    setSaving(true);
    try {
      if (holiday) {
        await api.updateHoliday(holiday.id, {
          name: form.name,
          date: form.date,
          isOptional: form.isOptional,
        });
        toast.success("Holiday updated");
      } else {
        await api.createHoliday({
          name: form.name,
          date: form.date,
          isOptional: form.isOptional,
        });
        toast.success("Holiday added");
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save holiday");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="rounded-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{holiday ? "Edit holiday" : "Add holiday"}</DialogTitle>
          <DialogDescription>Holidays are considered when calculating leave days.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" required placeholder="e.g. Independence Day" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isOptional} onChange={(e) => setForm({ ...form, isOptional: e.target.checked })} />
            Optional holiday
          </label>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : holiday ? "Save changes" : "Add holiday"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}