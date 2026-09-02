"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import { api, type User, apiFileUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Camera,
  Briefcase,
  Users,
  BadgeCheck,
  Save,
  Loader2,
  Info,
  Lock,
  User as UserIcon,
  MapPin,
  PhoneCall,
  Shield,
  CheckCircle2,
} from "lucide-react";

// ==================== ZOD VALIDATION SCHEMAS ====================

const basicDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  personalEmail: z.string().email("Invalid personal email").optional().or(z.literal("")),
  mobile: z.string().min(7, "Valid mobile number is required").optional().or(z.literal("")),
  gender: z.string().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  portfolioUrl: z.string().url("Invalid portfolio URL").optional().or(z.literal("")),
});

const addressSchema = z.object({
  currentLine1: z.string().optional().or(z.literal("")),
  currentCity: z.string().optional().or(z.literal("")),
  currentState: z.string().optional().or(z.literal("")),
  currentPincode: z.string().optional().or(z.literal("")),
  sameAsCurrent: z.boolean(),
  permLine1: z.string().optional().or(z.literal("")),
  permCity: z.string().optional().or(z.literal("")),
  permState: z.string().optional().or(z.literal("")),
  permPincode: z.string().optional().or(z.literal("")),
});

const emergencySchema = z.object({
  emergencyContactName: z.string().min(1, "Contact name is required"),
  emergencyContactRelation: z.string().min(1, "Relation is required"),
  emergencyContactPhone: z.string().min(7, "Phone number is required"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type BasicFormData = z.infer<typeof basicDetailsSchema>;
type AddressFormData = z.infer<typeof addressSchema>;
type EmergencyFormData = z.infer<typeof emergencySchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

// ==================== MAIN COMPONENT ====================

export default function ProfilePage() {
  const { user: authUser, refresh: refreshAuth } = useAuth();
  const [user, setUser] = useState<User | null>(authUser);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"personal" | "address" | "emergency" | "security">("personal");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch complete profile details from server
  const loadProfile = async () => {
    try {
      const res = await api.getProfile();
      setUser(res.data);
    } catch {
      setUser(authUser);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Sync when authUser updates
  useEffect(() => {
    if (authUser && !user) setUser(authUser);
  }, [authUser]);

  // ---------------- Basic Details Form ----------------
  const {
    register: regBasic,
    handleSubmit: handleBasicSubmit,
    reset: resetBasic,
    formState: { errors: errorsBasic, isSubmitting: isSubmittingBasic },
  } = useForm<BasicFormData>({
    resolver: zodResolver(basicDetailsSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      personalEmail: "",
      mobile: "",
      gender: "male",
      dateOfBirth: "",
      linkedinUrl: "",
      portfolioUrl: "",
    },
  });

  // ---------------- Address Form ----------------
  const {
    register: regAddress,
    handleSubmit: handleAddressSubmit,
    reset: resetAddress,
    watch: watchAddress,
    setValue: setAddressValue,
    formState: { errors: errorsAddress, isSubmitting: isSubmittingAddress },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      currentLine1: "",
      currentCity: "",
      currentState: "",
      currentPincode: "",
      sameAsCurrent: false,
      permLine1: "",
      permCity: "",
      permState: "",
      permPincode: "",
    },
  });

  const sameAsCurrent = watchAddress("sameAsCurrent");

  // ---------------- Emergency Contact Form ----------------
  const {
    register: regEmergency,
    handleSubmit: handleEmergencySubmit,
    reset: resetEmergency,
    formState: { errors: errorsEmergency, isSubmitting: isSubmittingEmergency },
  } = useForm<EmergencyFormData>({
    resolver: zodResolver(emergencySchema),
    defaultValues: {
      emergencyContactName: "",
      emergencyContactRelation: "Spouse",
      emergencyContactPhone: "",
    },
  });

  // ---------------- Security / Password Form ----------------
  const {
    register: regPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: errorsPassword, isSubmitting: isSubmittingPassword },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Populate forms when user data is loaded
  useEffect(() => {
    if (!user) return;

    const dobFormatted = user.profile?.dateOfBirth
      ? new Date(user.profile.dateOfBirth).toISOString().split("T")[0]
      : "";

    resetBasic({
      firstName: user.firstName || user.name?.split(" ")[0] || "",
      lastName: user.lastName || user.name?.split(" ").slice(1).join(" ") || "",
      personalEmail: user.personalEmail || "",
      mobile: user.mobile || user.phone || "",
      gender: user.gender || "male",
      dateOfBirth: dobFormatted,
      linkedinUrl: (user.profile?.linkedinUrl as string) || "",
      portfolioUrl: (user.profile?.portfolioUrl as string) || "",
    });

    const currAddr = (user.profile?.currentAddress as any) || {};
    const permAddr = (user.profile?.permanentAddress as any) || {};
    const isSame = !!user.profile?.sameAsCurrentAddress;

    resetAddress({
      currentLine1: currAddr.line1 || "",
      currentCity: currAddr.city || "",
      currentState: currAddr.state || "",
      currentPincode: currAddr.pincode || "",
      sameAsCurrent: isSame,
      permLine1: isSame ? currAddr.line1 || "" : permAddr.line1 || "",
      permCity: isSame ? currAddr.city || "" : permAddr.city || "",
      permState: isSame ? currAddr.state || "" : permAddr.state || "",
      permPincode: isSame ? currAddr.pincode || "" : permAddr.pincode || "",
    });

    resetEmergency({
      emergencyContactName: user.profile?.emergencyContactName || "",
      emergencyContactRelation: user.profile?.emergencyContactRelation || "Spouse",
      emergencyContactPhone: user.profile?.emergencyContactPhone || "",
    });
  }, [user, resetBasic, resetAddress, resetEmergency]);

  // Handle Avatar Upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Avatar image must be under 5MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const uploadRes = await api.uploadFile(file, "avatars");
      const url = uploadRes.data.url;
      await api.updateProfilePicture(url);
      setUser((prev) => (prev ? { ...prev, avatarUrl: url } : prev));
      await refreshAuth();
      toast.success("Profile picture updated successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Submit Basic Details
  const onSaveBasic = async (data: BasicFormData) => {
    try {
      const res = await api.updateProfileBasic(data);
      setUser(res.data);
      await refreshAuth();
      toast.success("Personal information updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update personal information");
    }
  };

  // Submit Address
  const onSaveAddress = async (data: AddressFormData) => {
    try {
      const currentAddress = {
        line1: data.currentLine1,
        city: data.currentCity,
        state: data.currentState,
        pincode: data.currentPincode,
      };

      const permanentAddress = data.sameAsCurrent
        ? currentAddress
        : {
            line1: data.permLine1,
            city: data.permCity,
            state: data.permState,
            pincode: data.permPincode,
          };

      const res = await api.updateProfileAddress({
        currentAddress,
        permanentAddress,
        sameAsCurrentAddress: data.sameAsCurrent,
      });
      setUser(res.data);
      await refreshAuth();
      toast.success("Address details updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update address details");
    }
  };

  // Submit Emergency Contact
  const onSaveEmergency = async (data: EmergencyFormData) => {
    try {
      const res = await api.updateProfileEmergency(data);
      setUser(res.data);
      await refreshAuth();
      toast.success("Emergency contact updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update emergency contact");
    }
  };

  // Submit Password Change
  const onSavePassword = async (data: PasswordFormData) => {
    try {
      await api.changeProfilePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password changed successfully");
      resetPassword({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to change password. Check your current password.");
    }
  };

  const displayName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.name || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleName =
    typeof user?.role === "string" ? user.role : user?.role?.displayName || user?.role?.name || "Member";
  const departmentName = user?.department?.name || "Operations";
  const employeeId = user?.employeeId || "LR-EMP-001";
  const designation = user?.designation || user?.currentEmployment?.designation || "Staff Member";

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        <div className="h-40 bg-surface rounded-2xl border border-border-base animate-pulse" />
        <div className="h-96 bg-surface rounded-2xl border border-border-base animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-12">
      {/* ================= Profile Header Card ================= */}
      <div className="bg-surface rounded-2xl shadow-xs border border-border-base p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        {/* Editable Avatar */}
        <div className="relative group shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
            disabled={uploadingAvatar}
          />
          <div
            onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
            className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-surface shadow-md bg-surface-subtle relative cursor-pointer group transition-transform duration-200 active:scale-95"
            role="button"
            tabIndex={0}
            aria-label="Change profile picture"
          >
            <Avatar className="w-full h-full">
              <AvatarImage
                src={user?.avatarUrl ? apiFileUrl(user.avatarUrl) : undefined}
                alt={displayName}
                className="w-full h-full object-cover"
              />
              <AvatarFallback className="bg-brand/10 text-brand text-2xl md:text-3xl font-bold font-heading">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Hover overlay with camera icon */}
            <div className="absolute inset-0 bg-neutral-900/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white">
              {uploadingAvatar ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : (
                <>
                  <Camera className="h-6 w-6 mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Info Text & Metadata */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left pt-1">
          <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
              {displayName}
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

      {/* ================= Main Tabbed Container ================= */}
      <div className="bg-surface rounded-2xl shadow-xs border border-border-base overflow-hidden">
        {/* Tabs Header */}
        <div className="flex border-b border-border-base overflow-x-auto scrollbar-none bg-surface-subtle/30">
          <button
            onClick={() => setActiveTab("personal")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "personal"
                ? "text-brand border-brand bg-surface"
                : "text-text-secondary border-transparent hover:text-text-primary hover:bg-surface-subtle/60"
            }`}
          >
            <UserIcon className="h-4 w-4" />
            Personal Info
          </button>

          <button
            onClick={() => setActiveTab("address")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "address"
                ? "text-brand border-brand bg-surface"
                : "text-text-secondary border-transparent hover:text-text-primary hover:bg-surface-subtle/60"
            }`}
          >
            <MapPin className="h-4 w-4" />
            Address
          </button>

          <button
            onClick={() => setActiveTab("emergency")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "emergency"
                ? "text-brand border-brand bg-surface"
                : "text-text-secondary border-transparent hover:text-text-primary hover:bg-surface-subtle/60"
            }`}
          >
            <PhoneCall className="h-4 w-4" />
            Emergency Contact
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "security"
                ? "text-brand border-brand bg-surface"
                : "text-text-secondary border-transparent hover:text-text-primary hover:bg-surface-subtle/60"
            }`}
          >
            <Shield className="h-4 w-4" />
            Security & Password
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            {/* ---------------- TAB 1: PERSONAL INFO ---------------- */}
            {activeTab === "personal" && (
              <motion.div
                key="personal"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleBasicSubmit(onSaveBasic)} className="flex flex-col gap-8">
                  {/* Basic Details Section */}
                  <div>
                    <h2 className="font-heading text-lg font-bold text-text-primary border-b border-border-base pb-3">
                      Basic Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="firstName" className="text-sm font-semibold text-text-primary">
                          First Name <span className="text-brand">*</span>
                        </Label>
                        <Input
                          id="firstName"
                          {...regBasic("firstName")}
                          placeholder="e.g. Arjun"
                          className="bg-surface border-border-base focus-visible:ring-brand/20 focus-visible:border-brand"
                        />
                        {errorsBasic.firstName && (
                          <p className="text-xs text-error">{errorsBasic.firstName.message}</p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="lastName" className="text-sm font-semibold text-text-primary">
                          Last Name <span className="text-brand">*</span>
                        </Label>
                        <Input
                          id="lastName"
                          {...regBasic("lastName")}
                          placeholder="e.g. Mehta"
                          className="bg-surface border-border-base focus-visible:ring-brand/20 focus-visible:border-brand"
                        />
                        {errorsBasic.lastName && (
                          <p className="text-xs text-error">{errorsBasic.lastName.message}</p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="personalEmail" className="text-sm font-semibold text-text-primary">
                          Personal Email
                        </Label>
                        <Input
                          id="personalEmail"
                          type="email"
                          {...regBasic("personalEmail")}
                          placeholder="arjun.personal@example.com"
                          className="bg-surface border-border-base focus-visible:ring-brand/20 focus-visible:border-brand"
                        />
                        {errorsBasic.personalEmail && (
                          <p className="text-xs text-error">{errorsBasic.personalEmail.message}</p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="mobile" className="text-sm font-semibold text-text-primary">
                          Mobile Number
                        </Label>
                        <Input
                          id="mobile"
                          type="tel"
                          {...regBasic("mobile")}
                          placeholder="+91 98765 43210"
                          className="bg-surface border-border-base focus-visible:ring-brand/20 focus-visible:border-brand"
                        />
                        {errorsBasic.mobile && (
                          <p className="text-xs text-error">{errorsBasic.mobile.message}</p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="gender" className="text-sm font-semibold text-text-primary">
                          Gender
                        </Label>
                        <select
                          id="gender"
                          {...regBasic("gender")}
                          className="w-full border border-border-base rounded-lg px-3.5 py-2.5 bg-surface text-sm text-text-primary focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all cursor-pointer"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="dateOfBirth" className="text-sm font-semibold text-text-primary">
                          Date of Birth
                        </Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          {...regBasic("dateOfBirth")}
                          className="bg-surface border-border-base focus-visible:ring-brand/20 focus-visible:border-brand"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional Links & Read-only Work Info */}
                  <div>
                    <h2 className="font-heading text-lg font-bold text-text-primary border-b border-border-base pb-3">
                      Professional Links & Locked Info
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="linkedinUrl" className="text-sm font-semibold text-text-primary">
                          LinkedIn Profile URL
                        </Label>
                        <Input
                          id="linkedinUrl"
                          type="url"
                          {...regBasic("linkedinUrl")}
                          placeholder="https://linkedin.com/in/username"
                          className="bg-surface border-border-base focus-visible:ring-brand/20 focus-visible:border-brand"
                        />
                        {errorsBasic.linkedinUrl && (
                          <p className="text-xs text-error">{errorsBasic.linkedinUrl.message}</p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="portfolioUrl" className="text-sm font-semibold text-text-primary">
                          Portfolio URL
                        </Label>
                        <Input
                          id="portfolioUrl"
                          type="url"
                          {...regBasic("portfolioUrl")}
                          placeholder="https://yourportfolio.com"
                          className="bg-surface border-border-base focus-visible:ring-brand/20 focus-visible:border-brand"
                        />
                        {errorsBasic.portfolioUrl && (
                          <p className="text-xs text-error">{errorsBasic.portfolioUrl.message}</p>
                        )}
                      </div>

                      {/* Read-Only: Official Email */}
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <Label className="text-sm font-semibold text-text-secondary flex items-center gap-1.5">
                          Official Work Email
                          <span title="Contact IT or HR to request changes">
                            <Info className="h-3.5 w-3.5 text-text-tertiary" />
                          </span>
                        </Label>
                        <Input
                          value={user?.email || ""}
                          readOnly
                          disabled
                          className="bg-surface-subtle text-text-tertiary cursor-not-allowed border-border-base font-mono"
                        />
                        <p className="text-[11px] text-text-tertiary">
                          Official work email is locked for administrative and compliance reasons.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-border-base/60">
                    <Button
                      type="submit"
                      disabled={isSubmittingBasic}
                      className="bg-brand hover:bg-brand/90 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2"
                    >
                      {isSubmittingBasic ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ---------------- TAB 2: ADDRESS ---------------- */}
            {activeTab === "address" && (
              <motion.div
                key="address"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleAddressSubmit(onSaveAddress)} className="flex flex-col gap-8">
                  {/* Current Address */}
                  <div>
                    <h2 className="font-heading text-lg font-bold text-text-primary border-b border-border-base pb-3">
                      Current Address
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <Label className="text-sm font-semibold text-text-primary">Street Address</Label>
                        <Input
                          {...regAddress("currentLine1")}
                          placeholder="e.g. Apt 402, Sunshine Towers, MG Road"
                          className="bg-surface border-border-base focus-visible:ring-brand/20 focus-visible:border-brand"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label className="text-sm font-semibold text-text-primary">City</Label>
                        <Input
                          {...regAddress("currentCity")}
                          placeholder="e.g. Bangalore"
                          className="bg-surface border-border-base focus-visible:ring-brand/20 focus-visible:border-brand"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label className="text-sm font-semibold text-text-primary">State</Label>
                        <Input
                          {...regAddress("currentState")}
                          placeholder="e.g. Karnataka"
                          className="bg-surface border-border-base focus-visible:ring-brand/20 focus-visible:border-brand"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label className="text-sm font-semibold text-text-primary">Zip / Postal Code</Label>
                        <Input
                          {...regAddress("currentPincode")}
                          placeholder="e.g. 560001"
                          className="bg-surface border-border-base focus-visible:ring-brand/20 focus-visible:border-brand"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Permanent Address */}
                  <div>
                    <div className="flex items-center justify-between border-b border-border-base pb-3">
                      <h2 className="font-heading text-lg font-bold text-text-primary">
                        Permanent Address
                      </h2>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          {...regAddress("sameAsCurrent")}
                          className="w-4 h-4 rounded text-brand focus:ring-brand border-border-base cursor-pointer"
                        />
                        <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                          Same as Current Address
                        </span>
                      </label>
                    </div>

                    <div
                      className={`grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 transition-opacity ${
                        sameAsCurrent ? "opacity-50 pointer-events-none" : "opacity-100"
                      }`}
                    >
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <Label className="text-sm font-semibold text-text-primary">Street Address</Label>
                        <Input
                          {...regAddress("permLine1")}
                          disabled={sameAsCurrent}
                          placeholder="e.g. House 12, Green Avenue"
                          className="bg-surface border-border-base"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label className="text-sm font-semibold text-text-primary">City</Label>
                        <Input
                          {...regAddress("permCity")}
                          disabled={sameAsCurrent}
                          placeholder="e.g. Mumbai"
                          className="bg-surface border-border-base"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label className="text-sm font-semibold text-text-primary">State</Label>
                        <Input
                          {...regAddress("permState")}
                          disabled={sameAsCurrent}
                          placeholder="e.g. Maharashtra"
                          className="bg-surface border-border-base"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label className="text-sm font-semibold text-text-primary">Zip / Postal Code</Label>
                        <Input
                          {...regAddress("permPincode")}
                          disabled={sameAsCurrent}
                          placeholder="e.g. 400001"
                          className="bg-surface border-border-base"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-border-base/60">
                    <Button
                      type="submit"
                      disabled={isSubmittingAddress}
                      className="bg-brand hover:bg-brand/90 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2"
                    >
                      {isSubmittingAddress ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Address
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ---------------- TAB 3: EMERGENCY CONTACT ---------------- */}
            {activeTab === "emergency" && (
              <motion.div
                key="emergency"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="max-w-2xl"
              >
                <form onSubmit={handleEmergencySubmit(onSaveEmergency)} className="flex flex-col gap-6">
                  <div>
                    <h2 className="font-heading text-lg font-bold text-text-primary border-b border-border-base pb-3">
                      Emergency Contact Details
                    </h2>
                    <p className="text-xs text-text-secondary mt-2">
                      Please provide contact details of a trusted person to notify in case of an emergency.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="emergencyContactName" className="text-sm font-semibold text-text-primary">
                      Contact Name <span className="text-brand">*</span>
                    </Label>
                    <Input
                      id="emergencyContactName"
                      {...regEmergency("emergencyContactName")}
                      placeholder="e.g. Priya Mehta"
                      className="bg-surface border-border-base focus-visible:ring-brand/20 focus-visible:border-brand"
                    />
                    {errorsEmergency.emergencyContactName && (
                      <p className="text-xs text-error">{errorsEmergency.emergencyContactName.message}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="emergencyContactRelation" className="text-sm font-semibold text-text-primary">
                      Relation <span className="text-brand">*</span>
                    </Label>
                    <select
                      id="emergencyContactRelation"
                      {...regEmergency("emergencyContactRelation")}
                      className="w-full border border-border-base rounded-lg px-3.5 py-2.5 bg-surface text-sm text-text-primary focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all cursor-pointer"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Child">Child</option>
                      <option value="Friend">Friend</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="emergencyContactPhone" className="text-sm font-semibold text-text-primary">
                      Emergency Phone Number <span className="text-brand">*</span>
                    </Label>
                    <Input
                      id="emergencyContactPhone"
                      type="tel"
                      {...regEmergency("emergencyContactPhone")}
                      placeholder="+91 98765 12345"
                      className="bg-surface border-border-base focus-visible:ring-brand/20 focus-visible:border-brand"
                    />
                    {errorsEmergency.emergencyContactPhone && (
                      <p className="text-xs text-error">{errorsEmergency.emergencyContactPhone.message}</p>
                    )}
                  </div>

                  <div className="flex justify-start pt-3 border-t border-border-base/60">
                    <Button
                      type="submit"
                      disabled={isSubmittingEmergency}
                      className="bg-brand hover:bg-brand/90 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2"
                    >
                      {isSubmittingEmergency ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Contact
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ---------------- TAB 4: SECURITY & PASSWORD ---------------- */}
            {activeTab === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="max-w-2xl"
              >
                <form onSubmit={handlePasswordSubmit(onSavePassword)} className="flex flex-col gap-6">
                  <div>
                    <h2 className="font-heading text-lg font-bold text-text-primary border-b border-border-base pb-3 flex items-center gap-2">
                      <Lock className="h-5 w-5 text-brand" /> Change Password
                    </h2>
                    <p className="text-xs text-text-secondary mt-2">
                      Ensure your account remains secure by updating your password regularly.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="currentPassword" className="text-sm font-semibold text-text-primary">
                      Current Password <span className="text-brand">*</span>
                    </Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="••••••••"
                      {...regPassword("currentPassword")}
                      className="bg-surface border-border-base focus-visible:ring-brand/20 focus-visible:border-brand"
                    />
                    {errorsPassword.currentPassword && (
                      <p className="text-xs text-error">{errorsPassword.currentPassword.message}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="newPassword" className="text-sm font-semibold text-text-primary">
                      New Password <span className="text-brand">*</span>
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password (min. 6 characters)"
                      {...regPassword("newPassword")}
                      className="bg-surface border-border-base focus-visible:ring-brand/20 focus-visible:border-brand"
                    />
                    <p className="text-[11px] text-text-tertiary">
                      Must be at least 6 characters long.
                    </p>
                    {errorsPassword.newPassword && (
                      <p className="text-xs text-error">{errorsPassword.newPassword.message}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-semibold text-text-primary">
                      Confirm New Password <span className="text-brand">*</span>
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter new password"
                      {...regPassword("confirmPassword")}
                      className="bg-surface border-border-base focus-visible:ring-brand/20 focus-visible:border-brand"
                    />
                    {errorsPassword.confirmPassword && (
                      <p className="text-xs text-error">{errorsPassword.confirmPassword.message}</p>
                    )}
                  </div>

                  <div className="flex justify-start pt-3 border-t border-border-base/60">
                    <Button
                      type="submit"
                      disabled={isSubmittingPassword}
                      className="bg-brand hover:bg-brand/90 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2"
                    >
                      {isSubmittingPassword ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Updating Password...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          Update Password
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
