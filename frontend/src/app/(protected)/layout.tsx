"use client";

import { useEffect } from "react";
import { AppShell } from "@/components/layouts/app-shell";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
