"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { api, RequestAnalytics, RequestLog } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  Database,
  Filter,
  Gauge,
  Globe,
  Info,
  ListChecks,
  Lock,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

function getMethodBadge(method: string) {
  const m = method.toUpperCase();
  switch (m) {
    case "GET":
      return "bg-info/10 text-info border-info/30";
    case "POST":
      return "bg-success/10 text-success border-success/30";
    case "PUT":
    case "PATCH":
      return "bg-warning/10 text-warning border-warning/30";
    case "DELETE":
      return "bg-error/10 text-error border-error/30";
    default:
      return "bg-surface-subtle text-text-tertiary border-border-base";
  }
}

function getStatusBadge(code: number) {
  if (code >= 500) return "bg-error/10 text-error border-error/30";
  if (code >= 400) return "bg-warning/10 text-warning border-warning/30";
  if (code >= 300) return "bg-info/10 text-info border-info/30";
  return "bg-success/10 text-success border-success/30";
}

export default function RequestsPage() {
  const { user } = useAuth();
  const roleName = typeof user?.role === "string" ? user.role : (user?.role as any)?.name || "";
  const isSuperadmin = roleName.toUpperCase() === "SUPERADMIN";

  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [analytics, setAnalytics] = useState<RequestAnalytics | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchUrl, setSearchUrl] = useState("");

  // Kanban Inspection Drawer State
  const [inspectingLog, setInspectingLog] = useState<RequestLog | null>(null);
  const [endpointStats, setEndpointStats] = useState<{ totalInvocations: number; avgLatencyMs: number; maxLatencyMs: number } | null>(null);
  const [loadingInspect, setLoadingInspect] = useState(false);

  const loadData = useCallback(async () => {
    if (!isSuperadmin) return;

    try {
      setLoading(true);
      const params: any = {};
      if (methodFilter !== "ALL") params.method = methodFilter;
      if (statusFilter === "ERRORS") params.statusCode = 500;
      if (statusFilter === "CLIENT_ERRORS") params.statusCode = 400;

      const [logRes, analyticsRes] = await Promise.all([
        api.listRequestLogs(page, limit, params),
        api.requestAnalytics(),
      ]);

      setLogs(logRes.data || []);
      setTotal(logRes.pagination.total);
      setTotalPages(logRes.pagination.totalPages);
      setAnalytics(analyticsRes.data || null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load request logs");
    } finally {
      setLoading(false);
    }
  }, [isSuperadmin, page, limit, methodFilter, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle opening Kanban Inspection Drawer for a request log
  async function handleInspect(log: RequestLog) {
    setInspectingLog(log);
    setLoadingInspect(true);
    setEndpointStats(null);
    try {
      const res = await api.getRequestLog(log.id);
      if (res.data && (res.data as any).endpointStats) {
        setEndpointStats((res.data as any).endpointStats);
      }
    } catch (err) {
      // Fallback if detail fetch fails
    } finally {
      setLoadingInspect(false);
    }
  }

  // If user is NOT Superadmin, render 403 Forbidden Access Card
  if (!isSuperadmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-error/10 text-error flex items-center justify-center shadow-md">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="font-heading text-xl font-bold text-text-primary">
            Superadmin Access Required
          </h2>
          <p className="text-xs text-text-tertiary">
            The Request Logs & API Telemetry module is strictly restricted to Superadmin accounts only.
          </p>
        </div>
        <Badge variant="outline" className="text-xs px-3 py-1 font-mono bg-surface-subtle text-text-tertiary">
          HTTP 403 Forbidden
        </Badge>
      </div>
    );
  }

  // Filter logs by URL search locally
  const filteredLogs = logs.filter((l) => {
    if (searchUrl && !l.url.toLowerCase().includes(searchUrl.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 flex flex-col min-h-[calc(100vh-100px)]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold text-text-primary tracking-tight">
              Advanced API Telemetry & Request Monitoring
            </h1>
            <Badge variant="outline" className="text-[10px] bg-brand/10 text-brand font-mono font-bold border-brand/30">
              SUPERADMIN ONLY
            </Badge>
          </div>
          <p className="text-xs text-text-tertiary mt-1">
            Real-time API traffic stream, latency distribution, and exception diagnosis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="h-9 text-xs gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* Summary Cards Row (4 Bento Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-border-base bg-surface rounded-xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              Total Traffic (24h)
            </span>
          </div>
          <div>
            <span className="font-heading text-3xl font-extrabold text-text-primary">
              {analytics ? analytics.totalRequests.toLocaleString() : "—"}
            </span>
            <p className="text-[11px] text-text-tertiary mt-0.5">Recorded HTTP Invocations</p>
          </div>
        </Card>

        <Card className="p-5 border border-border-base bg-surface rounded-xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center font-bold">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              Success Rate (200 OK)
            </span>
          </div>
          <div>
            <span className="font-heading text-3xl font-extrabold text-text-primary">
              {analytics ? `${analytics.successRate}%` : "—"}
            </span>
            <p className="text-[11px] text-success font-semibold mt-0.5">Healthy execution ratio</p>
          </div>
        </Card>

        <Card className="p-5 border border-border-base bg-surface rounded-xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-info/10 text-info flex items-center justify-center font-bold">
              <Gauge className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              Latency Spectrum
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-heading text-3xl font-extrabold text-text-primary">
                {analytics ? `${analytics.avgResponseTimeMs}` : "—"}
              </span>
              <span className="text-xs font-mono text-text-tertiary">ms avg</span>
            </div>
            <p className="text-[11px] text-info font-semibold mt-0.5">
              Max: {analytics?.maxResponseTimeMs || 0} ms · Min: {analytics?.minResponseTimeMs || 0} ms
            </p>
          </div>
        </Card>

        <Card className="p-5 border border-border-base bg-surface rounded-xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-error/10 text-error flex items-center justify-center font-bold">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              Exceptions (4xx / 5xx)
            </span>
          </div>
          <div>
            <span className="font-heading text-3xl font-extrabold text-text-primary">
              {analytics ? analytics.errorRequests.toLocaleString() : "—"}
            </span>
            <p className="text-[11px] text-error font-semibold mt-0.5">
              4xx: {analytics?.clientErrorRequests || 0} · 5xx: {analytics?.serverErrorRequests || 0}
            </p>
          </div>
        </Card>
      </div>

      {/* Advanced Telemetry Insights Grid (Top Slow Endpoints + Method Distribution) */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Slow Endpoints */}
          <Card className="p-4 border border-border-base bg-surface rounded-xl shadow-2xs space-y-3">
            <h3 className="font-bold text-xs font-heading text-text-primary uppercase tracking-wider border-b border-border-base pb-2 flex items-center justify-between">
              <span>Top Slowest Endpoints (Avg Latency)</span>
              <Zap className="h-4 w-4 text-warning" />
            </h3>

            <div className="space-y-2 text-xs">
              {analytics.topSlowEndpoints && analytics.topSlowEndpoints.length > 0 ? (
                analytics.topSlowEndpoints.map((e, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-border-base bg-surface-subtle/30 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <p className="font-mono text-[11px] font-semibold text-text-primary truncate">{e.url}</p>
                      <span className="text-[10px] text-text-tertiary font-mono">{e.count} calls</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-bold font-mono bg-warning/10 text-warning border-warning/30">
                      {e.avgLatencyMs} ms avg
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-xs text-text-tertiary">No slow endpoint data available.</p>
              )}
            </div>
          </Card>

          {/* Method & IP Telemetry */}
          <Card className="p-4 border border-border-base bg-surface rounded-xl shadow-2xs space-y-3">
            <h3 className="font-bold text-xs font-heading text-text-primary uppercase tracking-wider border-b border-border-base pb-2 flex items-center justify-between">
              <span>Top Active Client IPs</span>
              <Globe className="h-4 w-4 text-brand" />
            </h3>

            <div className="space-y-2 text-xs">
              {analytics.topActiveIps && analytics.topActiveIps.length > 0 ? (
                analytics.topActiveIps.map((ip, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-border-base bg-surface-subtle/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-3.5 w-3.5 text-brand" />
                      <span className="font-mono text-xs font-semibold text-text-primary">{ip.ipAddress}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-bold font-mono">
                      {ip.count} requests
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-xs text-text-tertiary">No IP telemetry available.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Main Request Stream Table */}
      <Card className="border border-border-base bg-surface rounded-xl shadow-2xs overflow-hidden flex flex-col flex-1">
        {/* Filters Bar */}
        <div className="p-4 border-b border-border-base flex flex-wrap items-center justify-between gap-3 bg-surface-subtle/20">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
              <input
                className="w-full h-8 pl-8 pr-3 bg-surface border border-border-base rounded-md text-xs focus:border-brand focus:outline-none"
                placeholder="Search endpoint URL path..."
                value={searchUrl}
                onChange={(e) => setSearchUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Method Filter */}
            <select
              className="h-8 rounded-md border border-border-base bg-surface px-2 text-xs font-medium text-text-primary focus:border-brand focus:outline-none"
              value={methodFilter}
              onChange={(e) => {
                setPage(1);
                setMethodFilter(e.target.value);
              }}
            >
              <option value="ALL">All Methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT / PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>

            {/* Status Filter */}
            <select
              className="h-8 rounded-md border border-border-base bg-surface px-2 text-xs font-medium text-text-primary focus:border-brand focus:outline-none"
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(e.target.value);
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="CLIENT_ERRORS">4xx Client Errors</option>
              <option value="ERRORS">5xx Server Errors</option>
            </select>

            {/* Page Size */}
            <select
              className="h-8 rounded-md border border-border-base bg-surface px-2 text-xs font-medium text-text-primary focus:border-brand focus:outline-none"
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
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle/40 border-b border-border-base text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                <th className="py-3 px-6">Method</th>
                <th className="py-3 px-6">Endpoint URL</th>
                <th className="py-3 px-6">Status Code</th>
                <th className="py-3 px-6">Latency</th>
                <th className="py-3 px-6">IP Address</th>
                <th className="py-3 px-6">Timestamp</th>
                <th className="py-3 px-6 text-right">Kanban Drawer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base/50 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-text-tertiary">
                    Loading telemetry request stream...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-text-tertiary">
                    No matching HTTP request logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-surface-subtle/30 transition-colors group">
                    <td className="py-3 px-6">
                      <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 font-bold uppercase", getMethodBadge(l.method))}>
                        {l.method}
                      </Badge>
                    </td>

                    <td className="py-3 px-6 font-mono text-text-primary max-w-[280px] truncate text-[11px]" title={l.url}>
                      {l.url}
                    </td>

                    <td className="py-3 px-6">
                      <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 font-bold font-mono", getStatusBadge(l.statusCode))}>
                        {l.statusCode}
                      </Badge>
                    </td>

                    <td className="py-3 px-6 font-mono text-text-tertiary text-xs">
                      {l.responseTime.toFixed(1)} ms
                    </td>

                    <td className="py-3 px-6 font-mono text-[11px] text-text-tertiary">
                      {l.ipAddress || "127.0.0.1"}
                    </td>

                    <td className="py-3 px-6 font-mono text-[11px] text-text-tertiary">
                      {new Date(l.createdAt).toLocaleTimeString()}
                    </td>

                    <td className="py-3 px-6 text-right">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleInspect(l)}
                        className="text-[10px] h-7 gap-1 border-brand/30 text-brand hover:bg-brand/10"
                      >
                        Inspect Kanban <ArrowUpRight className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border-base flex items-center justify-between text-xs text-text-tertiary bg-surface-subtle/20">
            <span>
              Page {page} of {totalPages} · Total {total} request logs
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Slide-over Kanban Drawer for Inspecting Request Log */}
      <Sheet open={Boolean(inspectingLog)} onOpenChange={(open) => !open && setInspectingLog(null)}>
        {inspectingLog && (
          <SheetContent className="sm:max-w-lg w-full bg-surface p-0 flex flex-col h-full border-l border-border-base shadow-2xl">
            {/* Drawer Header */}
            <SheetHeader className="p-6 border-b border-border-base bg-surface-subtle/40 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 font-bold uppercase", getMethodBadge(inspectingLog.method))}>
                  {inspectingLog.method}
                </Badge>
                <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 font-bold font-mono", getStatusBadge(inspectingLog.statusCode))}>
                  {inspectingLog.statusCode}
                </Badge>
              </div>

              <SheetTitle className="font-mono text-sm font-bold text-text-primary break-all">
                {inspectingLog.url}
              </SheetTitle>
              <SheetDescription className="text-[11px] text-text-tertiary font-mono">
                Log ID: {inspectingLog.id}
              </SheetDescription>
            </SheetHeader>

            {/* Drawer Body Cards */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Card 1: Performance Gauge & Execution Status */}
              <div className="p-4 rounded-xl border border-border-base bg-surface-subtle/30 space-y-3">
                <h4 className="font-bold text-xs text-text-primary uppercase tracking-wider flex items-center justify-between">
                  <span>Performance Telemetry</span>
                  <Gauge className="h-4 w-4 text-brand" />
                </h4>

                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="p-2.5 rounded-lg border border-border-base bg-surface">
                    <span className="text-[10px] text-text-tertiary uppercase block">Latency</span>
                    <span className="font-bold text-base text-text-primary">
                      {inspectingLog.responseTime.toFixed(2)} ms
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-border-base bg-surface">
                    <span className="text-[10px] text-text-tertiary uppercase block">Status</span>
                    <span className={cn("font-bold text-base", inspectingLog.isSuccess ? "text-success" : "text-error")}>
                      {inspectingLog.isSuccess ? "SUCCESS" : "EXCEPTION"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Endpoint Health & Invocations */}
              {endpointStats && (
                <div className="p-4 rounded-xl border border-border-base bg-surface-subtle/30 space-y-3">
                  <h4 className="font-bold text-xs text-text-primary uppercase tracking-wider flex items-center justify-between">
                    <span>Endpoint Aggregate Stats</span>
                    <Activity className="h-4 w-4 text-info" />
                  </h4>

                  <div className="grid grid-cols-3 gap-2 font-mono text-center">
                    <div className="p-2 bg-surface rounded-lg border border-border-base">
                      <span className="text-[9px] text-text-tertiary uppercase block">Calls</span>
                      <span className="font-bold text-xs text-text-primary">{endpointStats.totalInvocations}</span>
                    </div>
                    <div className="p-2 bg-surface rounded-lg border border-border-base">
                      <span className="text-[9px] text-text-tertiary uppercase block">Avg Latency</span>
                      <span className="font-bold text-xs text-info">{endpointStats.avgLatencyMs} ms</span>
                    </div>
                    <div className="p-2 bg-surface rounded-lg border border-border-base">
                      <span className="text-[9px] text-text-tertiary uppercase block">Max Latency</span>
                      <span className="font-bold text-xs text-warning">{endpointStats.maxLatencyMs} ms</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Card 3: Client Metadata */}
              <div className="p-4 rounded-xl border border-border-base bg-surface-subtle/30 space-y-2 font-mono text-[11px]">
                <h4 className="font-bold text-xs text-text-primary uppercase tracking-wider font-sans mb-2">
                  Client Context
                </h4>
                <div className="flex justify-between py-1 border-b border-border-base/40">
                  <span className="text-text-tertiary">Client IP:</span>
                  <span className="font-bold text-text-primary">{inspectingLog.ipAddress || "Internal / Localhost"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-text-tertiary">Timestamp:</span>
                  <span className="font-bold text-text-primary">{new Date(inspectingLog.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Card 4: Exception Details & Error Message */}
              {inspectingLog.errorMessage && (
                <div className="p-4 rounded-xl border border-error/30 bg-error/5 text-error space-y-2">
                  <h4 className="font-bold text-xs font-sans uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" /> Exception Message
                  </h4>
                  <pre className="p-3 rounded-lg bg-surface-dark text-error-container text-[11px] font-mono whitespace-pre-wrap overflow-x-auto border border-error/20">
                    {inspectingLog.errorMessage}
                  </pre>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-border-base flex justify-end bg-surface-subtle/30">
              <Button variant="outline" size="sm" onClick={() => setInspectingLog(null)}>
                Close Kanban Drawer
              </Button>
            </div>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}