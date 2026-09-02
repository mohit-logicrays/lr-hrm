"use client";

import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Briefcase, Users, BadgeCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, type User } from "@/lib/api";

interface ProfileHeaderProps {
  user: User | null;
  onAvatarUpdated: (newUrl: string) => void;
}

export function ProfileHeader({ user, onAvatarUpdated }: ProfileHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.name || "User";
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleName =
    typeof user?.role === "string" ? user.role : user?.role?.displayName || user?.role?.name || "Member";
  const departmentName = user?.department?.name || "General";
  const employeeId = user?.employeeId || "LR-EMP-001";
  const designation = user?.designation || user?.currentEmployment?.designation || "Team Member";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    setUploading(true);
    try {
      const uploadRes = await api.uploadFile(file, "avatars");
      const url = uploadRes.data.url;
      await api.updateProfilePicture(url);
      onAvatarUpdated(url);
      toast.success("Profile picture updated successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile picture");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-surface rounded-2xl shadow-xs border border-border-base p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
      {/* Decorative background blur */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-brand/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 -z-10 pointer-events-none" />

      {/* Avatar Editable */}
      <div className="relative group shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-surface shadow-md bg-surface-subtle relative cursor-pointer group"
          role="button"
          tabIndex={0}
          aria-label="Upload profile picture"
        >
          <Avatar className="w-full h-full">
            <AvatarImage
              src={user?.avatarUrl || undefined}
              alt={fullName}
              className="w-full h-full object-cover"
            />
            <AvatarFallback className="bg-brand/10 text-brand text-2xl md:text-3xl font-bold font-heading">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-neutral-900/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : (
              <>
                <Camera className="h-6 w-6 mb-1" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Change</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left pt-1">
        <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
            {fullName}
          </h1>
          <span className="bg-success/10 text-success text-xs font-semibold px-3 py-1 rounded-full border border-success/30 flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Active
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-2 gap-x-5 text-text-secondary text-sm mb-4">
          <div className="flex items-center gap-1.5">
            <Briefcase className="h-4 w-4 text-brand" />
            <span className="font-medium text-text-primary">{designation}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-brand" />
            <span>{departmentName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BadgeCheck className="h-4 w-4 text-brand" />
            <span className="font-mono text-xs bg-surface-subtle px-2 py-0.5 rounded-md border border-border-base font-semibold text-text-primary">
              {employeeId}
            </span>
          </div>
        </div>

        <p className="text-xs text-text-tertiary">
          Role: <span className="font-semibold text-text-primary capitalize">{roleName}</span> · Official email:{" "}
          <span className="font-mono text-text-secondary">{user?.email}</span>
        </p>
      </div>
    </div>
  );
}
