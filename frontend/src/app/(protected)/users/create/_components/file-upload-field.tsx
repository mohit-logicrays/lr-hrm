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
  maxSizeBytes?: number;
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
  maxSizeBytes = 10 * 1024 * 1024,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (maxSizeBytes && file.size > maxSizeBytes) {
      const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
      toast.error(`File size exceeds the limit of ${maxMb}MB`);
      return;
    }

    if (accept.includes("application/pdf") && !accept.includes("image") && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Invalid file format. Only PDF documents are allowed.");
      return;
    }

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

  if (preview === "image") {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        {/* Avatar / Image Preview Box */}
        <div className="relative h-16 w-16 shrink-0 rounded-full border-2 border-border-base bg-surface overflow-hidden shadow-2xs group">
          {value ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={apiFileUrl(value)}
                alt="Profile Preview"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onClear) onClear();
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                aria-label="Remove image"
                title="Remove photo"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-surface-subtle text-text-tertiary">
              <Upload className="h-5 w-5 opacity-40" />
            </div>
          )}
        </div>

        {/* Upload Trigger Button & Info */}
        <div className="flex-1 space-y-1">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border-base bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary shadow-2xs hover:bg-surface-subtle hover:border-brand/40 transition-colors">
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-brand" />
            ) : (
              <Upload className="h-3.5 w-3.5 shrink-0 text-brand" />
            )}
            <span>{uploading ? "Uploading photo..." : value ? "Change Photo" : label}</span>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={accept}
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.currentTarget.value = "";
              }}
            />
          </label>
          {value && (
            <p className="text-[10px] text-success font-medium flex items-center gap-1">
              ✓ Photo uploaded & attached
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <label
          className="flex-1 flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-dashed border-border-base bg-surface-subtle/40 px-3 py-2.5 text-xs text-text-primary transition-colors hover:border-brand/50 hover:bg-surface-subtle"
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
            <span className="truncate font-medium">
              {uploading ? "Uploading…" : value ? value.split("/").pop() || "Document attached ✓" : label}
            </span>
          </span>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={accept}
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.currentTarget.value = "";
            }}
          />
        </label>

        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg border border-border-base text-text-tertiary hover:text-error hover:bg-error/10 hover:border-error/30 transition-colors cursor-pointer"
            title="Remove attachment"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}