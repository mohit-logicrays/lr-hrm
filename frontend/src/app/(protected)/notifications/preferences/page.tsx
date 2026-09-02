"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  Mail,
  Smartphone,
  Save,
  Moon,
  CheckCircle2,
  Shield,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api, type NotificationPreference } from "@/lib/api";

export default function NotificationPreferencesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushStatus, setPushStatus] = useState<string>("default");

  const [prefs, setPrefs] = useState<NotificationPreference>({
    id: "",
    userId: "",
    emailLeaves: true,
    emailTimesheet: true,
    emailProjects: true,
    emailSupport: true,
    pushLeaves: true,
    pushTimesheet: true,
    pushProjects: true,
    pushSupport: true,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
  });

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushStatus(Notification.permission);
    }

    api
      .getNotificationPreferences()
      .then((res) => {
        if (res.data) setPrefs(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleRequestPushPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Browser notifications are not supported on this device");
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setPushStatus(perm);
      if (perm === "granted") {
        toast.success("Browser push notifications enabled!");
      } else {
        toast.warning("Push notifications permission was denied");
      }
    } catch {
      toast.error("Failed to request permission");
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.updateNotificationPreferences(prefs);
      toast.success("Notification preferences updated successfully");
    } catch {
      toast.error("Failed to update preferences");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-text-tertiary">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent mx-auto mb-2" />
        Loading notification settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link
            href="/notifications"
            className="inline-flex items-center gap-1 text-xs text-brand hover:underline font-semibold mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Notifications
          </Link>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-text-primary flex items-center gap-2">
            Notification Preferences
          </h1>
          <p className="text-xs text-text-tertiary mt-1">
            Choose what alerts you receive via In-App, Email, and Browser Push notifications.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand text-white hover:bg-brand-hover text-xs h-9 px-4 gap-1.5 font-semibold cursor-pointer shadow-2xs"
        >
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </div>

      {/* Push Notification Device Permission Card */}
      <Card className="p-5 border border-brand/30 bg-brand/5 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center font-bold shrink-0">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-bold text-text-primary">
              Browser Push Notifications
            </h3>
            <p className="text-xs text-text-tertiary mt-0.5">
              Status: <strong className="capitalize text-text-primary">{pushStatus}</strong>
              {pushStatus === "granted" ? " (Enabled on this browser)" : " (Requires permission)"}
            </p>
          </div>
        </div>

        {pushStatus !== "granted" && (
          <Button
            size="sm"
            onClick={handleRequestPushPermission}
            className="bg-brand text-white hover:bg-brand-hover text-xs font-semibold shrink-0 cursor-pointer"
          >
            Enable Browser Push
          </Button>
        )}
      </Card>

      {/* Module Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email Notifications */}
        <Card className="p-6 border border-border-base bg-surface rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border-base">
            <Mail className="h-5 w-5 text-brand" />
            <div>
              <h3 className="font-heading text-sm font-bold text-text-primary">Email Notifications</h3>
              <p className="text-[11px] text-text-tertiary">Send summary & critical alerts to your email</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {[
              { key: "emailLeaves", label: "Leave Requests & Approvals", desc: "Notify when leave status changes" },
              { key: "emailTimesheet", label: "Timesheet Submissions", desc: "Notify on approvals and rejections" },
              { key: "emailProjects", label: "Project & Task Milestones", desc: "Notify on task assignments and deadlines" },
              { key: "emailSupport", label: "Support Ticket Updates", desc: "Notify on replies and resolutions" },
            ].map((item) => (
              <label key={item.key} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-surface-subtle transition-colors cursor-pointer border border-transparent hover:border-border-base">
                <input
                  type="checkbox"
                  checked={(prefs as any)[item.key]}
                  onChange={(e) => setPrefs({ ...prefs, [item.key]: e.target.checked })}
                  className="rounded border-border-base text-brand focus:ring-brand h-4 w-4 mt-0.5 cursor-pointer"
                />
                <div>
                  <p className="text-xs font-semibold text-text-primary font-heading">{item.label}</p>
                  <p className="text-[11px] text-text-tertiary">{item.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </Card>

        {/* Push Notifications */}
        <Card className="p-6 border border-border-base bg-surface rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border-base">
            <Smartphone className="h-5 w-5 text-brand" />
            <div>
              <h3 className="font-heading text-sm font-bold text-text-primary">In-App & Push Alerts</h3>
              <p className="text-[11px] text-text-tertiary">Real-time alerts on your active screen</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {[
              { key: "pushLeaves", label: "Leave Requests & Approvals", desc: "Real-time in-app bell & push" },
              { key: "pushTimesheet", label: "Timesheet Alerts", desc: "Real-time timelog approvals" },
              { key: "pushProjects", label: "Project & Task Assignments", desc: "Immediate task assign notifications" },
              { key: "pushSupport", label: "Support Ticket Responses", desc: "Instant ticket feedback" },
            ].map((item) => (
              <label key={item.key} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-surface-subtle transition-colors cursor-pointer border border-transparent hover:border-border-base">
                <input
                  type="checkbox"
                  checked={(prefs as any)[item.key]}
                  onChange={(e) => setPrefs({ ...prefs, [item.key]: e.target.checked })}
                  className="rounded border-border-base text-brand focus:ring-brand h-4 w-4 mt-0.5 cursor-pointer"
                />
                <div>
                  <p className="text-xs font-semibold text-text-primary font-heading">{item.label}</p>
                  <p className="text-[11px] text-text-tertiary">{item.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </Card>
      </div>

      {/* Quiet Hours Card */}
      <Card className="p-6 border border-border-base bg-surface rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border-base">
          <Moon className="h-5 w-5 text-brand" />
          <div>
            <h3 className="font-heading text-sm font-bold text-text-primary">Quiet Hours (Do Not Disturb)</h3>
            <p className="text-[11px] text-text-tertiary">Mute non-critical notifications during your rest hours</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md pt-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-secondary">Start Time</label>
            <input
              type="time"
              value={prefs.quietHoursStart || "22:00"}
              onChange={(e) => setPrefs({ ...prefs, quietHoursStart: e.target.value })}
              className="h-9 w-full rounded-lg border border-border-base bg-surface px-3 text-xs text-text-primary focus:border-brand focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-secondary">End Time</label>
            <input
              type="time"
              value={prefs.quietHoursEnd || "08:00"}
              onChange={(e) => setPrefs({ ...prefs, quietHoursEnd: e.target.value })}
              className="h-9 w-full rounded-lg border border-border-base bg-surface px-3 text-xs text-text-primary focus:border-brand focus:outline-none"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
