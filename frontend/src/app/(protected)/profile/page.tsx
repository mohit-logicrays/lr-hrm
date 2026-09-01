"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [saving, setSaving] = useState(false);
  const [userInitials] = useState(() => {
  const parts = (user?.name ?? "").trim().split(/\s+/);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
});
const [form, setForm] = useState({
  firstName: userInitials.firstName,
  lastName: userInitials.lastName,
  designation: user?.designation ?? "",
  phone: user?.phone ?? "",
});

async function onSubmit(e: FormEvent) {
  e.preventDefault();
  setSaving(true);
  try {
    await api.updateProfile({
      firstName: form.firstName,
      lastName: form.lastName,
      designation: form.designation || null,
      phone: form.phone || null,
    });
    await refresh();
    toast.success("Profile updated");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Failed to update profile");
  } finally {
    setSaving(false);
  }
}

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary">
          Profile
        </h1>
        <p className="text-sm text-text-secondary">Manage your basic details.</p>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-base">Basic details</CardTitle>
          <CardDescription>{user?.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="profile-form" onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  value={form.designation}
                  onChange={(e) =>
                    setForm({ ...form, designation: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button type="submit" form="profile-form" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
