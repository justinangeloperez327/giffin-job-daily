import { HardHat } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";

export default function ProjectsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Projects"
        description="Manage project, job number, and sales order information."
      />
      <EmptyState
        icon={HardHat}
        title="No project interface yet"
        description="Project management will be implemented in Group 4."
      />
    </div>
  );
}
