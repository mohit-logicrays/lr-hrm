"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import { api, User } from "@/lib/api";
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
  const [form, setForm] = useState({
    name: user?.name ?? "",
    designation: user?.designation ?? "",
    phone: user?.phone ?? "",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProfile(form as Partial<User>);
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
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
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
