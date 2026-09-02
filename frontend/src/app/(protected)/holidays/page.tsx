"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  api,
  type Holiday,
  type HolidayType,
} from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AddEditHolidaySheet } from "@/components/holidays/AddEditHolidaySheet";
import { ImportHolidayModal } from "@/components/holidays/ImportHolidayModal";
import { UpcomingHolidaysWidget } from "@/components/holidays/UpcomingHolidaysWidget";
import { RichTextViewer } from "@/components/ui/rich-text-editor";
import {
  Calendar as CalendarIcon,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  FileSpreadsheet,
  Filter,
  Globe,
  LayoutGrid,
  List,
  Plus,
  PartyPopper,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Framer Motion Animation Variants
const containerVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25 } },
};

export default function HolidayManagementPage() {
  const { user } = useAuth();
  const roleName = typeof user?.role === "string" ? user.role : (user?.role as any)?.name || "";
  const isHr = ["SUPERADMIN", "HR_ADMIN", "ADMIN"].includes(roleName.toUpperCase());

  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal / Sheet States
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Calendar Month State
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [res, upcomingRes] = await Promise.all([
        api.listHolidays(1, 100, year, search),
        api.getUpcomingHolidays(),
      ]);

      setHolidays(res.data);
      setUpcomingHolidays(upcomingRes.data || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load holidays");
    } finally {
      setLoading(false);
    }
  }, [year, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.deleteHoliday(id);
      toast.success(`Holiday "${name}" deleted`);
      loadData();
    } catch (err) {
      toast.error("Failed to delete holiday");
    }
  }

  function downloadTemplate() {
    const csvContent = [
      "Holiday Name,Date,Type,Is Optional,Description",
      "Republic Day,2026-01-26,National,No,National Republic Day Observance",
      "Holi,2026-03-25,Restricted,Yes,Festival of Colors (Optional)",
      "Founders Day,2026-08-15,Company,No,Logic Rays Company Celebration",
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "holiday_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded sample CSV template");
  }

  // Summary Metrics
  const totalHolidays = holidays.length;
  const nationalCount = holidays.filter((h) => h.type === "NATIONAL").length;
  const restrictedCount = holidays.filter((h) => h.type === "RESTRICTED" || h.isOptional).length;
  const companyCount = holidays.filter((h) => h.type === "COMPANY").length;

  // Calendar Calculations
  const curYear = calendarMonth.getFullYear();
  const curMonth = calendarMonth.getMonth();
  const monthName = calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 flex flex-col min-h-[calc(100vh-100px)]"
    >
      {/* Top Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary tracking-tight">
            Holiday Management
          </h1>
          <p className="text-xs text-text-tertiary mt-1">
            View and manage company holidays, observances, and restricted days.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Year Selector */}
          <select
            className="h-9 rounded-md border border-border-base bg-surface px-3 text-xs font-bold text-text-primary focus:border-brand focus:outline-none cursor-pointer"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
            <option value={2024}>2024</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-md border border-border-base bg-surface p-0.5">
            <button
              onClick={() => setViewMode("calendar")}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all",
                viewMode === "calendar" ? "bg-brand text-white shadow-2xs" : "text-text-tertiary hover:text-text-primary"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Calendar
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all",
                viewMode === "list" ? "bg-brand text-white shadow-2xs" : "text-text-tertiary hover:text-text-primary"
              )}
            >
              <List className="h-3.5 w-3.5" /> List
            </button>
          </div>

          {/* HR Only Action Buttons */}
          {isHr && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="h-9 text-xs gap-1.5 cursor-pointer"
                title="Download CSV Template"
              >
                <Download className="h-3.5 w-3.5" /> Template
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsImportOpen(true)}
                className="h-9 text-xs gap-1.5 border-brand/30 text-brand hover:bg-brand/5 cursor-pointer"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" /> Import CSV
              </Button>
              <Button
                onClick={() => {
                  setEditingHoliday(null);
                  setIsAddEditOpen(true);
                }}
                className="h-9 text-xs bg-brand hover:bg-brand-hover text-white px-4 font-semibold gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Holiday
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Summary Cards Row (4 Bento-Style Metric Cards) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <Card className="p-5 border border-border-base bg-surface rounded-xl shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold">
                <Globe className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                National Holidays
              </span>
            </div>
            <div>
              <span className="font-heading text-3xl font-extrabold text-text-primary">{nationalCount}</span>
              <p className="text-[11px] text-text-tertiary mt-0.5">Mandatory company-wide</p>
            </div>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <Card className="p-5 border border-border-base bg-surface rounded-xl shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full bg-warning/10 text-warning flex items-center justify-center font-bold">
                <CalendarDays className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                Restricted (Floating)
              </span>
            </div>
            <div>
              <span className="font-heading text-3xl font-extrabold text-text-primary">{restrictedCount}</span>
              <p className="text-[11px] text-warning font-semibold mt-0.5">Optional observances</p>
            </div>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <Card className="p-5 border border-border-base bg-surface rounded-xl shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full bg-info/10 text-info flex items-center justify-center font-bold">
                <PartyPopper className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                Company Events
              </span>
            </div>
            <div>
              <span className="font-heading text-3xl font-extrabold text-text-primary">{companyCount}</span>
              <p className="text-[11px] text-text-tertiary mt-0.5">Special internal observances</p>
            </div>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <Card className="p-5 border border-border-base bg-surface rounded-xl shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center font-bold">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                Upcoming (60 Days)
              </span>
            </div>
            <div>
              <span className="font-heading text-3xl font-extrabold text-text-primary">
                {upcomingHolidays.length}
              </span>
              <p className="text-[11px] text-success font-semibold mt-0.5">Next upcoming holiday</p>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Main Workspace Layout (3 Cols Left Calendar/Table | 1 Col Right Sidebar) */}
      <motion.div variants={itemVariants} className="grid grid-cols-12 gap-6 flex-1">
        {/* Main Section (8 Cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <AnimatePresence mode="wait">
            {viewMode === "calendar" ? (
              /* Calendar View */
              <motion.div
                key="calendar-view"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border border-border-base bg-surface rounded-xl shadow-2xs overflow-hidden flex flex-col">
                  {/* Calendar Controls */}
                  <div className="px-6 py-4 border-b border-border-base flex justify-between items-center bg-surface-subtle/30">
                    <div className="flex items-center gap-3">
                      <h3 className="font-heading text-sm font-bold text-text-primary flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-brand" /> {monthName}
                      </h3>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setCalendarMonth(new Date())}
                        className="text-[11px] h-7 cursor-pointer"
                      >
                        Today
                      </Button>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon-xs"
                        onClick={() =>
                          setCalendarMonth(new Date(curYear, curMonth - 1, 1))
                        }
                        className="h-7 w-7 cursor-pointer"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-xs"
                        onClick={() =>
                          setCalendarMonth(new Date(curYear, curMonth + 1, 1))
                        }
                        className="h-7 w-7 cursor-pointer"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Calendar Day Header */}
                  <div className="grid grid-cols-7 border-b border-border-base bg-surface-subtle/40 text-center font-bold text-[10px] text-text-tertiary uppercase py-2">
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-px bg-border-base/40 text-xs">
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                      const dateObj = new Date(curYear, curMonth, day);
                      const isToday =
                        new Date().toDateString() === dateObj.toDateString();

                      const dayHolidays = holidays.filter((h) => {
                        const hd = new Date(h.date);
                        return (
                          hd.getFullYear() === curYear &&
                          hd.getMonth() === curMonth &&
                          hd.getDate() === day
                        );
                      });

                      return (
                        <div
                          key={day}
                          className={cn(
                            "p-2 bg-surface min-h-[90px] flex flex-col justify-start hover:bg-surface-subtle/40 transition-colors relative group",
                            isToday && "ring-2 ring-brand ring-inset"
                          )}
                        >
                          <div className="flex justify-between items-center text-[11px] font-mono font-bold text-text-tertiary mb-1">
                            {isToday && (
                              <span className="text-[9px] font-bold text-brand uppercase">Today</span>
                            )}
                            <span className={cn("ml-auto", isToday && "text-brand font-bold")}>
                              {day}
                            </span>
                          </div>

                          <div className="space-y-1 overflow-y-auto max-h-[60px] pr-0.5">
                            {dayHolidays.map((h) => (
                              <div
                                key={h.id}
                                onClick={() => {
                                  if (isHr) {
                                    setEditingHoliday(h);
                                    setIsAddEditOpen(true);
                                  }
                                }}
                                className={cn(
                                  "p-1.5 rounded border text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-2xs",
                                  h.type === "NATIONAL" && "bg-brand/10 border-brand/30 text-brand",
                                  h.type === "RESTRICTED" && "bg-warning/10 border-warning/30 text-warning",
                                  h.type === "COMPANY" && "bg-info/10 border-info/30 text-info"
                                )}
                                title={`${h.name} (${h.type})`}
                              >
                                <span
                                  className={cn(
                                    "w-1.5 h-1.5 rounded-full shrink-0",
                                    h.type === "NATIONAL" && "bg-brand",
                                    h.type === "RESTRICTED" && "bg-warning",
                                    h.type === "COMPANY" && "bg-info"
                                  )}
                                />
                                <span className="truncate">{h.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>
            ) : (
              /* List View */
              <motion.div
                key="list-view"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border border-border-base bg-surface rounded-xl shadow-2xs overflow-hidden">
                  <div className="p-4 border-b border-border-base flex items-center justify-between">
                    <div className="relative w-64">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
                      <input
                        className="w-full h-8 pl-8 pr-3 bg-surface border border-border-base rounded-md text-xs focus:border-brand focus:outline-none"
                        placeholder="Search holiday name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <span className="text-xs text-text-tertiary font-mono">
                      Total: {holidays.length} Holidays
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-subtle/40 border-b border-border-base text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                          <th className="py-3 px-6">Holiday Name</th>
                          <th className="py-3 px-6">Date</th>
                          <th className="py-3 px-6">Day</th>
                          <th className="py-3 px-6">Type</th>
                          <th className="py-3 px-6">Optional</th>
                          {isHr && <th className="py-3 px-6 text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-base/50 text-xs">
                        {loading ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-text-tertiary">
                              Loading holidays...
                            </td>
                          </tr>
                        ) : holidays.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-text-tertiary">
                              No holidays found for year {year}.
                            </td>
                          </tr>
                        ) : (
                          holidays.map((h) => {
                            const dateObj = new Date(h.date);
                            const dayName = dateObj.toLocaleDateString(undefined, { weekday: "long" });

                            return (
                              <tr key={h.id} className="hover:bg-surface-subtle/30 transition-colors group">
                                <td className="py-3 px-6 font-semibold text-text-primary flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold shrink-0">
                                    <PartyPopper className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-text-primary">{h.name}</p>
                                    {h.description && (
                                      <div className="text-[10px] text-text-tertiary line-clamp-1">
                                        <RichTextViewer content={h.description} />
                                      </div>
                                    )}
                                  </div>
                                </td>

                                <td className="py-3 px-6 font-mono font-semibold text-text-tertiary">
                                  {dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                </td>

                                <td className="py-3 px-6 text-text-tertiary">{dayName}</td>

                                <td className="py-3 px-6">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider rounded-md",
                                      h.type === "NATIONAL" && "bg-brand/10 text-brand border-brand/30",
                                      h.type === "RESTRICTED" && "bg-warning/10 text-warning border-warning/30",
                                      h.type === "COMPANY" && "bg-info/10 text-info border-info/30"
                                    )}
                                  >
                                    {h.type}
                                  </Badge>
                                </td>

                                <td className="py-3 px-6">
                                  {h.isOptional ? (
                                    <Badge variant="outline" className="text-[9px] bg-surface-subtle text-text-tertiary">
                                      Yes
                                    </Badge>
                                  ) : (
                                    <span className="text-text-tertiary font-mono">—</span>
                                  )}
                                </td>

                                {isHr && (
                                  <td className="py-3 px-6 text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        onClick={() => {
                                          setEditingHoliday(h);
                                          setIsAddEditOpen(true);
                                        }}
                                        className="h-7 w-7 text-text-tertiary hover:text-brand cursor-pointer"
                                        title="Edit"
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        onClick={() => handleDelete(h.id, h.name)}
                                        className="h-7 w-7 text-text-tertiary hover:text-error cursor-pointer"
                                        title="Delete"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Sidebar (4 Cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <UpcomingHolidaysWidget holidays={upcomingHolidays} />
        </div>
      </motion.div>

      {/* Manual Entry Drawer */}
      <AddEditHolidaySheet
        holiday={editingHoliday}
        isOpen={isAddEditOpen}
        onClose={() => {
          setIsAddEditOpen(false);
          setEditingHoliday(null);
        }}
        onSuccess={() => loadData()}
      />

      {/* Bulk CSV Import Modal */}
      <ImportHolidayModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => loadData()}
      />
    </motion.div>
  );
}