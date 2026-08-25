"use client";

import { useAuth } from "@/providers/auth-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-text-secondary">
          Here is your workspace overview.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="text-base">Dashboard</CardTitle>
            <CardDescription>
              Widgets and metrics will be planned here.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-text-tertiary">
            Coming soon
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
