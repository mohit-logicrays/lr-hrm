"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api, RequestAnalytics, RequestLog } from "@/lib/api";
import { usePermission } from "@/providers/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, AlertTriangle, Gauge, RefreshCw, ListChecks } from "lucide-react";

function methodClass(m: string) {
  switch (m.toUpperCase()) {
    case "GET":
      return "bg-info-light text-info";
    case "POST":
      return "bg-success-light text-success";
    case "PUT":
    case "PATCH":
      return "bg-warning-light text-warning";
    case "DELETE":
      return "bg-error-light text-error";
    default:
      return "bg-neutral-100 text-neutral-700";
  }
}

export default function RequestsPage() {
  usePermission("request");
  const [logs, setLogs] = useState<{ data: RequestLog[]; total: number; totalPages: number } | null>(null);
  const [analytics, setAnalytics] = useState<RequestAnalytics | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [errorOnly, setErrorOnly] = useState(false);

  const load = useCallback(async () => {
    try {
      const [l, a] = await Promise.all([
        api.listRequestLogs(page, limit, errorOnly ? { statusCode: 500 } : {}),
        api.requestAnalytics(),
      ]);
      setLogs({ data: l.data, total: l.pagination.total, totalPages: l.pagination.totalPages });
      setAnalytics(a.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load request logs");
    } finally {
      setLoading(false);
    }
  }, [page, limit, errorOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const cards = [
    {
      label: "Total requests",
      value: analytics ? analytics.totalRequests.toLocaleString() : "—",
      icon: <Activity className="h-4 w-4 text-brand" />,
    },
    {
      label: "Success rate",
      value: analytics ? `${Math.round(analytics.successRate * 100) / 100}%` : "—",
      icon: <ListChecks className="h-4 w-4 text-success" />,
    },
    {
      label: "Avg response",
      value: analytics ? `${analytics.avgResponseTimeMs.toFixed(1)}ms` : "—",
      icon: <Gauge className="h-4 w-4 text-info" />,
    },
    {
      label: "Errors",
      value: analytics ? analytics.errorRequests.toLocaleString() : "—",
      icon: <AlertTriangle className="h-4 w-4 text-error" />,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Request Logs"
        subtitle="API traffic and analytics"
        actions={
          <Button variant="outline" onClick={load}>
            <RefreshCw /> Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-border-base bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">{c.label}</span>
              {c.icon}
            </div>
            <p className="mt-2 text-2xl font-bold text-text-primary">{c.value}</p>
          </div>
        ))}
      </div>

      {analytics && analytics.countsByMethod.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {analytics.countsByMethod.map((m) => (
            <Badge key={m.method} className={methodClass(m.method)}>
              {m.method} · {m._count._all}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <select
          aria-label="Errors only"
          className="h-10 rounded-md border border-border-base bg-surface px-3 text-sm"
          value={errorOnly ? "errors" : "all"}
          onChange={(e) => {
            setPage(1);
            setErrorOnly(e.target.value === "errors");
          }}
        >
          <option value="all">All logs</option>
          <option value="errors">5xx errors</option>
        </select>
        <select
          aria-label="Page size"
          className="h-10 rounded-md border border-border-base bg-surface px-3 text-sm"
          value={limit}
          onChange={(e) => {
            setPage(1);
            setLimit(Number(e.target.value));
          }}
        >
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
        </select>
      </div>

      <div className="rounded-lg border border-border-base bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Method</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              logs?.data.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <Badge className={methodClass(l.method)}>{l.method}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[260px] truncate text-xs text-text-secondary">
                    {l.url}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-sm font-medium ${
                        l.statusCode >= 500
                          ? "text-error"
                          : l.statusCode >= 400
                            ? "text-warning"
                            : "text-success"
                      }`}
                    >
                      {l.statusCode}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    {l.responseTime.toFixed(1)}ms
                  </TableCell>
                  <TableCell className="text-xs text-text-tertiary">
                    {l.ipAddress ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-text-tertiary">
                    {new Date(l.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {logs && logs.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-tertiary">
            Page {page} of {logs.totalPages} · {logs.total} logs
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= logs.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}