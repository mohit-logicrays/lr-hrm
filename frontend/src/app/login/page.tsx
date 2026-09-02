"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Eye, EyeOff, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="flex min-h-screen w-full bg-surface">
      {/* ── Left: Form ─────────────────────────────── */}
      <div className="flex w-full flex-col justify-center bg-surface px-6 py-12 lg:w-1/2 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mx-auto w-full max-w-md"
        >
          <div className="mb-4 flex justify-center">
            <Image
              src="/lr_icon.png"
              alt="Logic Rays logo"
              width={64}
              height={64}
              className="h-14 w-14 object-contain"
              priority
            />
          </div>

          <h1 className="text-center font-heading text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            Welcome back!
          </h1>
          <p className="mt-3 text-center text-base text-text-secondary">
            Manage your workforce with ease
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-6" noValidate>
            {/* Quick Demo Credentials Info Banner */}
            <div className="rounded-lg border border-brand/20 bg-brand/5 p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-semibold text-brand">
                <span>Default Super Admin Credentials:</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("admin@logicrays.com");
                    setPassword("LogicRays@2026");
                  }}
                  className="text-[11px] underline hover:text-brand-hover cursor-pointer"
                >
                  Auto-fill
                </button>
              </div>
              <p className="text-text-secondary font-mono text-[11px]">
                Email: <strong className="text-text-primary">admin@logicrays.com</strong>
                <br />
                Password: <strong className="text-text-primary">LogicRays@2026</strong>
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error"
              >
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="h-11 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 pr-10 text-base"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted transition-colors hover:text-text-primary focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-text-primary">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-border-strong text-brand focus:ring-brand"
                />
                Remember me
              </label>
              <a
                href="#"
                className="text-sm font-medium text-brand hover:text-brand-hover"
              >
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="brand"
              disabled={loadingSession}
              className="h-11 w-full rounded-lg text-base"
            >
              {loadingSession ? (
                <>
                  <Lock className="h-4 w-4 animate-pulse" />
                  Signing in…
                </>
              ) : (
                "Log in"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative mt-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-surface px-3 text-text-muted">
                or continue with
              </span>
            </div>
          </div>

          {/* Social buttons */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <SocialButton label="Continue with Google">
              <GoogleIcon className="h-5 w-5" />
            </SocialButton>
            <SocialButton label="Continue with Apple">
              <AppleIcon className="h-5 w-5" />
            </SocialButton>
            <SocialButton label="Continue with X">
              <XIcon className="h-5 w-5" />
            </SocialButton>
          </div>

          <p className="mt-8 text-center text-sm text-text-secondary">
            Don&apos;t have an account?{" "}
            <a href="#" className="font-medium text-brand hover:text-brand-hover">
              Sign Up
            </a>
          </p>
        </motion.div>
      </div>

      {/* ── Right: Visual ──────────────────────────── */}
      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-lighter via-surface to-surface-subtle p-12 lg:flex">
        <div className="relative z-10 flex max-w-lg flex-col items-center text-center">
          <div className="mb-8 w-full overflow-hidden">
            <Image
              src="/login.gif"
              alt="Logic Rays HRM animation"
              width={593}
              height={409}
              unoptimized
              className="h-auto w-full rounded-2xl object-contain"
            />
          </div>

          <h2 className="font-heading text-2xl font-semibold text-text-primary">
            Empower your team with Logic Rays HRM
          </h2>
          <p className="mt-4 max-w-md text-sm text-text-secondary">
            Streamline your HR processes, manage talent effectively, and focus
            on what matters most — your people.
          </p>
        </div>

        {/* Glow accents (decorative) */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
        </div>
      </div>
    </div>
  );
}

function SocialButton({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <a
      href="#"
      aria-label={label}
      className="flex items-center justify-center rounded-lg border border-border bg-surface py-3 text-text-secondary shadow-sm transition-colors hover:bg-brand-soft hover:text-text-primary"
    >
      {children}
    </a>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.86-3.08.38-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.38C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
