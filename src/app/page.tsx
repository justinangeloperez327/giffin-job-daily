import {
  CalendarDays,
  HardHat,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
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
import {
  formatTimeValue,
  getScheduleDateInTimeZone,
} from "@/lib/date-time";
import { cn } from "@/lib/utils";
import { loadDashboardSummary } from "@/server/services/dashboard";

export const dynamic = "force-dynamic";

function displayTiming(
  campStartTime: Date | null,
  startTime: Date | null,
  endTime: Date | null,
) {
  const camp = formatTimeValue(campStartTime);
  const start = formatTimeValue(startTime);
  const end = formatTimeValue(endTime);

  if (!camp && !start && !end) {
    return "—";
  }

  const work = start || end ? `${start ?? "—"}–${end ?? "—"}` : null;

  return [camp ? `Camp ${camp}` : null, work].filter(Boolean).join(" · ");
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof CalendarDays;
}) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const timeZone = process.env.APP_TIME_ZONE ?? "Asia/Dubai";
  const today = getScheduleDateInTimeZone(new Date(), timeZone);
  const result = await loadDashboardSummary({ scheduleDate: today });

  if (!result.ok) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Dashboard"
          description="Daily workforce and project scheduling overview."
        />
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {result.error.message}
        </div>
      </div>
    );
  }

  const data = result.data;
  const visibleSchedules = data.schedules.slice(0, 8);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        description="Daily workforce and project scheduling overview."
        actions={
          <Link
            href={`/daily-schedule?date=${encodeURIComponent(today)}`}
            className={buttonVariants()}
          >
            <CalendarDays className="size-4" />
            Open Daily Schedule
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Projects Today"
          value={data.today.projectCount}
          detail="Projects scheduled for today"
          icon={CalendarDays}
        />
        <Metric
          label="Labour Assigned"
          value={data.today.labourCount}
          detail="Labour assignments for today"
          icon={UserRoundCheck}
        />
        <Metric
          label="Projects"
          value={data.totalProjects}
          detail="Projects available for scheduling"
          icon={HardHat}
        />
        <Metric
          label="Employees"
          value={data.totalEmployees}
          detail="Employees in the resource pool"
          icon={UsersRound}
        />
      </div>

      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Today&apos;s Plan</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {data.today.foremanCount} foremen · {data.today.driverCount} drivers
              {" · "}
              {data.today.assignedEmployeeCount} unique employees assigned
            </p>
          </div>

          <Link
            href={`/daily-schedule?date=${encodeURIComponent(today)}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "self-start sm:self-auto",
            )}
          >
            View schedule
          </Link>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Project</TableHead>
              <TableHead>Foreman</TableHead>
              <TableHead className="text-right">Labours</TableHead>
              <TableHead>Timing</TableHead>
              <TableHead>Logistics</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {visibleSchedules.length > 0 ? (
              visibleSchedules.map((schedule) => (
                <TableRow key={schedule.projectJobNo}>
                  <TableCell>
                    <div className="font-medium">
                      {schedule.project.projectName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Job {schedule.projectJobNo} · SO {schedule.project.soNo}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{schedule.foreman.employeeName}</div>
                    <div className="text-xs text-muted-foreground">
                      {schedule.foreman.employeeId}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {schedule.labours.length}
                  </TableCell>
                  <TableCell>
                    {displayTiming(
                      schedule.campStartTime,
                      schedule.startTime,
                      schedule.endTime,
                    )}
                  </TableCell>
                  <TableCell>
                    {schedule.driver || schedule.equipmentVehicle ? (
                      <div>
                        <div>
                          {schedule.driver?.employeeName ?? "No driver"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {schedule.equipmentVehicle ?? "No vehicle/equipment"}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="h-40 text-center">
                  <p className="text-sm font-medium">
                    No projects scheduled today
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Open Daily Schedule to create today&apos;s workforce plan.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {data.schedules.length > visibleSchedules.length ? (
          <div className="border-t px-4 py-2 text-xs text-muted-foreground">
            Showing 8 of {data.schedules.length} scheduled projects.
          </div>
        ) : null}
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        <Link
          href="/projects"
          className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/40"
        >
          <span>
            <span className="block text-sm font-medium">Projects</span>
            <span className="block text-xs text-muted-foreground">
              Maintain project, job number, and SO information.
            </span>
          </span>
          <HardHat className="size-4 text-muted-foreground" aria-hidden="true" />
        </Link>

        <Link
          href="/labours"
          className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/40"
        >
          <span>
            <span className="block text-sm font-medium">Labours</span>
            <span className="block text-xs text-muted-foreground">
              Maintain employee, designation, and mobile information.
            </span>
          </span>
          <UsersRound className="size-4 text-muted-foreground" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
