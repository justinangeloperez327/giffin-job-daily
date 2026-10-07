import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/login-form";
import { getCurrentUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Giffin Job Daily
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to the workforce scheduling workspace.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <LoginForm />
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Accounts are created by an administrator.
        </p>
      </div>
    </main>
  );
}
