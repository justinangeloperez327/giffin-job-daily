import { AppShell } from "@/components/layout/app-shell";
import { requirePageUser } from "@/server/auth/session";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageUser();

  return <AppShell currentUser={user}>{children}</AppShell>;
}
