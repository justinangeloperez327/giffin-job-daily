import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { ResetPasswordForm } from "@/features/users/reset-password-form";
import { UserForm } from "@/features/users/user-form";
import { requirePageRole } from "@/server/auth/session";
import { getUserById } from "@/server/services/users";

export const dynamic = "force-dynamic";

function displayDate(value: Date | null) {
  if (!value) return "Never";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageRole("ADMIN");
  const { id } = await params;
  const result = await getUserById(id);

  if (!result.ok) {
    if (result.error.code === "NOT_FOUND" || result.error.code === "VALIDATION") {
      notFound();
    }

    return (
      <div className="space-y-3">
        <PageHeader title="User" />
        <div role="alert" className="rounded-none border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {result.error.message}
        </div>
      </div>
    );
  }

  const user = result.data;

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <PageHeader
        title={user.name}
        description={user.email}
        actions={
          <Link
            href="/users"
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowLeft className="size-4" />
            Users
          </Link>
        }
      />

      <div className="grid overflow-hidden rounded-none border bg-card sm:grid-cols-3">
        <div className="border-b px-3 py-2 sm:border-b-0 sm:border-r">
          <p className="text-xs text-muted-foreground">Created</p>
          <p className="mt-1 text-sm font-medium">
            {displayDate(user.createdAt)}
          </p>
        </div>
        <div className="border-b px-3 py-2 sm:border-b-0 sm:border-r">
          <p className="text-xs text-muted-foreground">Last login</p>
          <p className="mt-1 text-sm font-medium">
            {displayDate(user.lastLoginAt)}
          </p>
        </div>
        <div className="px-3 py-2">
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="mt-1 text-sm font-medium">
            {user.isActive ? "Active" : "Inactive"}
          </p>
        </div>
      </div>

      <section className="space-y-3 rounded-none border bg-card p-3">
        <div>
          <h2 className="text-base font-semibold">Account</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Update identity, role, or access status.
          </p>
        </div>
        <UserForm user={user} />
      </section>

      <section className="space-y-3 rounded-none border bg-card p-3">
        <div>
          <h2 className="text-base font-semibold">Reset Password</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Resetting a password signs the user out of all existing sessions.
          </p>
        </div>
        <ResetPasswordForm userId={user.id} />
      </section>
    </div>
  );
}
