import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { UserForm } from "@/features/users/user-form";
import { requirePageRole } from "@/server/auth/session";

export default async function NewUserPage() {
  await requirePageRole("ADMIN");

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader
        title="Add User"
        description="Create an internal account. Public registration is disabled."
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

      <div className="rounded-lg border bg-card p-5">
        <UserForm />
      </div>
    </div>
  );
}
