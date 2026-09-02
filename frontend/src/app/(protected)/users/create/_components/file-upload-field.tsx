"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Loader2, FileText, X } from "lucide-react";
import { api, apiFileUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

interface FileUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  onClear?: () => void;
  accept?: string;
  className?: string;
  preview?: "image" | "none";
  label?: React.ReactNode;
  folder?: string;
}

export function FileUploadField({
  value,
  onChange,
  onClear,
  accept = "image/*,application/pdf,.doc,.docx",
  className,
  preview = "none",
  label = "Upload file",
  folder = "documents",
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const res = await api.uploadFile(file, folder);
      onChange(res.data.url);
      toast.success("File uploaded successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label
        className="flex cursor-pointer items-center justify-between gap-2 rounded-md border border-dashed border-border-base bg-surface-subtle/40 px-3 py-2.5 text-xs text-text-primary transition-colors hover:border-brand/50 hover:bg-surface-subtle"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer?.files?.[0];
          if (file) handleFile(file);
        }}
      >
        <span className="flex items-center gap-2 min-w-0">
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-brand" />
          ) : value ? (
            <FileText className="h-3.5 w-3.5 shrink-0 text-success" />
          ) : (
            <Upload className="h-3.5 w-3.5 shrink-0 text-brand" />
          )}
          <span className="truncate">{uploading ? "Uploading…" : value ? "Uploaded ✓" : label}</span>
        </span>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.currentTarget.value = "";
          }}
        />
      </label>

      {preview === "image" && value && (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border-base bg-surface-subtle">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={apiFileUrl(value)} alt="Preview" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => {
              if (onClear) onClear();
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-error text-white"
            aria-label="Remove upload"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      )}
    </div>
  );
}