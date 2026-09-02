"use client";

import { useState, ChangeEvent } from "react";
import { toast } from "sonner";
import { api, type HolidayType } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParsedHolidayRow {
  rowNum: number;
  name: string;
  date: string;
  type: HolidayType;
  isOptional: boolean;
  description?: string;
  isValid: boolean;
  errorReason?: string;
}

interface ImportHolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportHolidayModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportHolidayModalProps) {
  const [parsedRows, setParsedRows] = useState<ParsedHolidayRow[]>([]);
  const [importing, setImporting] = useState(false);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        toast.error("CSV file is empty or missing data rows");
        return;
      }

      // Headers: Holiday Name, Date, Type, Is Optional, Description
      const rows: ParsedHolidayRow[] = [];
      const seenDates = new Set<string>();

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        const name = cols[0] || "";
        const date = cols[1] || "";
        const rawType = (cols[2] || "National").toUpperCase();
        const rawOpt = (cols[3] || "No").toLowerCase();
        const description = cols[4] || "";

        let isValid = true;
        let errorReason = "";

        if (!name) {
          isValid = false;
          errorReason = "Missing Holiday Name";
        } else if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          isValid = false;
          errorReason = "Invalid date format (Use YYYY-MM-DD)";
        } else if (seenDates.has(date)) {
          isValid = false;
          errorReason = `Duplicate date in CSV (${date})`;
        } else if (!["NATIONAL", "RESTRICTED", "COMPANY"].includes(rawType)) {
          isValid = false;
          errorReason = "Type must be National, Restricted, or Company";
        }

        if (isValid) {
          seenDates.add(date);
        }

        let typeVal: HolidayType = "NATIONAL";
        if (rawType === "RESTRICTED") typeVal = "RESTRICTED";
        if (rawType === "COMPANY") typeVal = "COMPANY";

        rows.push({
          rowNum: i,
          name,
          date,
          type: typeVal,
          isOptional: ["yes", "true", "1"].includes(rawOpt),
          description,
          isValid,
          errorReason,
        });
      }

      setParsedRows(rows);
      toast.info(`Parsed ${rows.length} rows (${rows.filter((r) => r.isValid).length} valid)`);
    };
    reader.readAsText(file);
  }

  function downloadTemplate() {
    const csvContent = [
      "Holiday Name,Date,Type,Is Optional,Description",
      "Republic Day,2026-01-26,National,No,National Republic Day Celebration",
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
    toast.success("Download started for holiday_import_template.csv");
  }

  async function handleConfirmImport() {
    const validRecords = parsedRows.filter((r) => r.isValid);
    if (validRecords.length === 0) {
      toast.error("No valid holiday records to import");
      return;
    }

    setImporting(true);
    try {
      const res = await api.importHolidaysCsv(
        validRecords.map((r) => ({
          name: r.name,
          date: r.date,
          type: r.type,
          isOptional: r.isOptional,
          description: r.description,
        }))
      );

      toast.success(
        `Successfully imported ${res.data.importedCount} holidays! ${
          res.data.failedCount > 0 ? `(${res.data.failedCount} skipped)` : ""
        }`
      );
      onSuccess();
      onClose();
      setParsedRows([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to import holidays");
    } finally {
      setImporting(false);
    }
  }

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl w-full bg-surface border border-border-base rounded-xl shadow-lg p-6 space-y-4">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2 text-brand">
            <FileSpreadsheet className="h-5 w-5" />
            <DialogTitle className="font-heading text-lg font-bold text-text-primary">
              Bulk Import Holidays via CSV
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-text-tertiary">
            Upload CSV file with headers: Holiday Name, Date (YYYY-MM-DD), Type, Is Optional, Description
          </DialogDescription>
        </DialogHeader>

        {/* Upload & Template Control */}
        <div className="p-4 border-2 border-dashed border-border-base rounded-xl bg-surface-subtle/30 flex flex-col items-center justify-center gap-2 text-center">
          <Upload className="h-8 w-8 text-brand" />
          <div>
            <p className="text-xs font-bold text-text-primary">Select a CSV file to upload</p>
            <p className="text-[11px] text-text-tertiary">Supports .csv files</p>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> Download Template
            </Button>
            <label className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold bg-brand text-white hover:bg-brand-hover cursor-pointer shadow-2xs gap-1.5">
              <Upload className="h-3.5 w-3.5" /> Choose CSV
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>

        {/* Preview Summary */}
        {parsedRows.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-text-primary">
                <span>Validation Preview</span>
                <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/30">
                  {validCount} Valid
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="outline" className="text-[10px] bg-error/10 text-error border-error/30">
                    {invalidCount} Invalid
                  </Badge>
                )}
              </div>
            </div>

            {/* Validation Table */}
            <div className="border border-border-base rounded-lg max-h-48 overflow-y-auto bg-surface text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-subtle/50 border-b border-border-base text-[10px] font-bold text-text-tertiary uppercase">
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-base/50 text-[11px]">
                  {parsedRows.map((r) => (
                    <tr key={r.rowNum} className={cn(!r.isValid && "bg-error/5")}>
                      <td className="py-2 px-3 font-mono">{r.rowNum}</td>
                      <td className="py-2 px-3 font-semibold text-text-primary">{r.name || "—"}</td>
                      <td className="py-2 px-3 font-mono text-text-tertiary">{r.date || "—"}</td>
                      <td className="py-2 px-3 font-mono">{r.type}</td>
                      <td className="py-2 px-3">
                        {r.isValid ? (
                          <span className="inline-flex items-center gap-1 text-success font-semibold">
                            <CheckCircle2 className="h-3 w-3" /> Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-error font-semibold" title={r.errorReason}>
                            <AlertCircle className="h-3 w-3" /> {r.errorReason}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-border-base flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={validCount === 0 || importing}
            onClick={handleConfirmImport}
            className="bg-brand hover:bg-brand-hover text-white font-semibold gap-1.5"
          >
            <CheckCircle2 className="h-4 w-4" />
            {importing ? "Importing..." : `Confirm & Import (${validCount} Records)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
