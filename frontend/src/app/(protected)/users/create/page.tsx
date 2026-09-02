"use client";

import { Suspense } from "react";
import { UserWizard } from "./_components";

export default function CreateUserWizardPage() {
  return (
    <Suspense fallback={null}>
      <UserWizard mode="create" />
    </Suspense>
  );
}
