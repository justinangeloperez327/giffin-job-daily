import { UsersRound } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";

export default function LaboursPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Labours"
        description="Manage employees and designations used by daily schedules."
      />
      <EmptyState
        icon={UsersRound}
        title="No labour interface yet"
        description="Labour management will be implemented in Group 5."
      />
    </div>
  );
}
