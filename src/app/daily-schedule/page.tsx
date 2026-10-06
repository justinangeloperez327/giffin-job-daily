import { CalendarDays } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";

export default function DailySchedulePage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Daily Schedule"
        description="Plan daily project resources, timing, targets, and logistics."
      />
      <EmptyState
        icon={CalendarDays}
        title="Daily scheduling is ready for implementation"
        description="The scheduling board will be implemented in the Daily Schedule groups."
      />
    </div>
  );
}
