"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api, type TimesheetReports } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Calendar,
  Download,
  PieChart,
  Users,
  Building2,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function TimesheetReportsTab() {
  const [reports, setReports] = useState<TimesheetReports | null>(null);
  const [loading, setLoading] = useState(true);

  // Date Filters
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getTimesheetReports(from || undefined, to || undefined);
      setReports(res.data || null);
    } catch (err) {
      toast.error("Failed to load timesheet reports");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function exportCsv() {
    if (!reports || reports.employeeUtilization.length === 0) {
      return toast.warning("No analytics data available to export");
    }

    const headers = "Employee,Department,Total Hours,Billable Hours,Utilization Rate %\n";
    const rows = reports.employeeUtilization
      .map(
        (u) =>
          `"${u.name}","${u.department}",${u.totalHours},${u.billableHours},${u.utilizationRate}%`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheet_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported timesheet analytics CSV");
  }

  return (
    <div className="space-y-6">
      {/* Header & Export Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-heading text-lg font-bold text-text-primary">Timesheet Analytics & Reports</h2>
          <p className="text-xs text-text-tertiary">
            Comprehensive breakdown of project hours, billable ratios, and employee utilization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-surface border border-border-base rounded-lg p-1">
            <input
              type="date"
              className="h-7 px-2 text-xs rounded border border-border-base bg-surface text-text-primary focus:outline-none"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <span className="text-xs text-text-tertiary">to</span>
            <input
              type="date"
              className="h-7 px-2 text-xs rounded border border-border-base bg-surface text-text-primary focus:outline-none"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <Button
            onClick={exportCsv}
            className="h-9 text-xs bg-brand hover:bg-brand-hover text-white font-semibold gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hours per Project */}
        <Card className="lg:col-span-2 p-5 border border-border-base bg-surface rounded-xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-border-base pb-3">
            <h3 className="font-heading text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-brand" /> Hours per Project
            </h3>
            <span className="text-xs text-text-tertiary font-mono">
              Total Projects: {reports?.hoursPerProject.length || 0}
            </span>
          </div>

          {loading ? (
            <p className="text-xs text-text-tertiary py-8 text-center">Loading project breakdown...</p>
          ) : !reports || reports.hoursPerProject.length === 0 ? (
            <p className="text-xs text-text-tertiary py-8 text-center">No logged project hours available.</p>
          ) : (
            <div className="space-y-3">
              {reports.hoursPerProject.map((p) => {
                const maxH = Math.max(...reports.hoursPerProject.map((item) => item.totalHours), 1);
                const pct = Math.round((p.totalHours / maxH) * 100);

                return (
                  <div key={p.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-text-primary">{p.name} ({p.code})</span>
                      <span className="font-mono text-brand">{p.totalHours} hrs</span>
                    </div>
                    <div className="w-full bg-surface-subtle h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-brand h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Billable Ratio */}
        <Card className="p-5 border border-border-base bg-surface rounded-xl shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="border-b border-border-base pb-3">
            <h3 className="font-heading text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <PieChart className="h-4 w-4 text-success" /> Billable Ratio
            </h3>
          </div>

          {reports ? (
            <div className="space-y-4 text-center my-auto">
              <div>
                <span className="font-heading text-4xl font-extrabold text-text-primary">
                  {reports.billableRatio.billablePercentage}%
                </span>
                <p className="text-xs text-success font-semibold mt-1">Billable Utilization</p>
              </div>

              <div className="w-full bg-surface-subtle h-3 rounded-full overflow-hidden flex">
                <div
                  className="bg-success h-full"
                  style={{ width: `${reports.billableRatio.billablePercentage}%` }}
                />
                <div
                  className="bg-warning h-full"
                  style={{ width: `${100 - reports.billableRatio.billablePercentage}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2">
                <div className="p-2 bg-surface-subtle rounded-lg">
                  <span className="text-[10px] text-text-tertiary uppercase block">Billable</span>
                  <span className="font-bold text-success">{reports.billableRatio.billableHours}h</span>
                </div>
                <div className="p-2 bg-surface-subtle rounded-lg">
                  <span className="text-[10px] text-text-tertiary uppercase block">Non-Billable</span>
                  <span className="font-bold text-warning">{reports.billableRatio.nonBillableHours}h</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-tertiary py-8 text-center">Loading ratio...</p>
          )}
        </Card>
      </div>

      {/* Employee Utilization Table */}
      <Card className="border border-border-base bg-surface rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-border-base flex justify-between items-center bg-surface-subtle/30">
          <h3 className="font-heading text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <Users className="h-4 w-4 text-brand" /> Detailed Employee Utilization
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle/40 border-b border-border-base text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                <th className="py-3 px-6">Employee</th>
                <th className="py-3 px-6">Department</th>
                <th className="py-3 px-6">Total Hours</th>
                <th className="py-3 px-6">Billable Hours</th>
                <th className="py-3 px-6 text-right">Utilization Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base/50 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-tertiary">
                    Loading utilization report...
                  </td>
                </tr>
              ) : !reports || reports.employeeUtilization.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-tertiary">
                    No employee utilization logs available.
                  </td>
                </tr>
              ) : (
                reports.employeeUtilization.map((emp) => (
                  <tr key={emp.id} className="hover:bg-surface-subtle/30 transition-colors">
                    <td className="py-3 px-6 font-bold text-text-primary">{emp.name}</td>
                    <td className="py-3 px-6 text-text-tertiary">{emp.department}</td>
                    <td className="py-3 px-6 font-mono font-semibold">{emp.totalHours}h</td>
                    <td className="py-3 px-6 font-mono font-semibold text-success">{emp.billableHours}h</td>
                    <td className="py-3 px-6 text-right">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-2 py-0.5 font-bold font-mono",
                          emp.utilizationRate >= 80
                            ? "bg-success/10 text-success border-success/30"
                            : emp.utilizationRate >= 50
                            ? "bg-warning/10 text-warning border-warning/30"
                            : "bg-error/10 text-error border-error/30"
                        )}
                      >
                        {emp.utilizationRate}%
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
