"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);

  // Already authenticated → straight to the dashboard
  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoadingSession(true);
    try {
      await api.login(email, password);
      await refresh(); // sync auth state before navigating
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoadingSession(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-subtle px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <Card className="rounded-lg border-border-base shadow-md">
          <CardHeader className="text-center">
            <span className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-md bg-brand text-base font-bold text-white">
              LR
            </span>
            <CardTitle className="text-xl font-bold">Sign in to LR HRM</CardTitle>
            <CardDescription>
              Use the credentials provided by your administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error"
                >
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button
                type="submit"
                disabled={loadingSession}
                className="w-full rounded-md"
              >
                {loadingSession ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
