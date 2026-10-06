import { CalendarDays, HardHat, UsersRound } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";

const items = [
  {
    icon: CalendarDays,
    title: "Daily Schedule",
    description: "Plan projects, foremen, labour, timing, targets, and logistics.",
  },
  {
    icon: HardHat,
    title: "Projects",
    description: "Maintain project, job number, and sales order information.",
  },
  {
    icon: UsersRound,
    title: "Labours",
    description: "Maintain employees and designations used by daily schedules.",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        description="Daily workforce and project scheduling workspace."
      />

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-medium">Workspace</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            The operational modules are being built on this application foundation.
          </p>
        </div>

        <div className="divide-y">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="flex items-start gap-3 px-4 py-4"
              >
                <div className="mt-0.5 rounded-md border bg-muted/40 p-2">
                  <Icon className="size-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
