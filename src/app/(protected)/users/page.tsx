import { Plus, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requirePageRole } from "@/server/auth/session";
import { listUsers } from "@/server/services/users";

export const dynamic = "force-dynamic";

function roleLabel(role: string) {
  return role === "ADMIN"
    ? "Administrator"
    : role === "PLANNER"
      ? "Planner"
      : "Viewer";
}

function displayDate(value: Date | null) {
  if (!value) return "Never";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default async function UsersPage() {
  await requirePageRole("ADMIN");
  const result = await listUsers();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users"
        description="Manage application access and operational roles."
        actions={
          <Link href="/users/new" className={buttonVariants()}>
            <Plus className="size-4" />
            Add User
          </Link>
        }
      />

      {!result.ok ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {result.error.message}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Link
                      href={`/users/${user.id}`}
                      className="font-medium hover:underline"
                    >
                      {user.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5">
                      {user.role === "ADMIN" ? (
                        <ShieldCheck className="size-3.5" />
                      ) : null}
                      {roleLabel(user.role)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <span>Active</span>
                    ) : (
                      <span className="text-muted-foreground">Inactive</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {displayDate(user.lastLoginAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
