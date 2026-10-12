import { CalendarDays } from "lucide-react";
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
  formatTimeLabel,
  formatTimeValue,
  formatScheduleDate,
  getScheduleDateInTimeZone,
} from "@/lib/date-time";
import { cn } from "@/lib/utils";
import { summarizeOperations, shiftFromTime } from "@/features/daily-schedule/operational-summary";
import { loadUpcomingScheduleDates } from "@/server/services/dashboard";
import { loadDashboardSummary } from "@/server/services/dashboard";

export const dynamic = "force-dynamic";

function displayTiming(
  campStartTime: Date | null,
  startTime: Date | null,
  endTime: Date | null,
) {
  const camp = campStartTime ? formatTimeLabel(formatTimeValue(campStartTime)) : null;
  const start = startTime ? formatTimeLabel(formatTimeValue(startTime)) : null;
  const end = endTime ? formatTimeLabel(formatTimeValue(endTime)) : null;

  if (!camp && !start && !end) {
    return "—";
  }

  const work = start || end ? `${start ?? "—"}–${end ?? "—"}` : null;

  return [camp ? `Camp ${camp}` : null, work].filter(Boolean).join(" · ");
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const timeZone = process.env.APP_TIME_ZONE ?? "Asia/Dubai";
  const today = getScheduleDateInTimeZone(new Date(), timeZone);
  const [result, upcomingResult] = await Promise.all([
    loadDashboardSummary({ scheduleDate: today }),
    loadUpcomingScheduleDates(today),
  ]);

  if (!result.ok) {
    return (
      <div className="space-y-3">
        <PageHeader
          title="Dashboard"
        />
        <div role="alert" className="rounded-none border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {result.error.message}
        </div>
      </div>
    );
  }

  const data = result.data;
  const visibleSchedules = data.schedules;
  const operations = summarizeOperations(data.schedules, data.totalEmployees);

  return (
    <div className="space-y-3">
      <PageHeader
        title="Dashboard"
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

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 2xl:grid-cols-6">
        <Metric label="Projects today" value={data.today.projectCount} />
        <Metric label="Foremen assigned" value={operations.foremanCount} />
        <Metric label="Labours assigned" value={operations.labourCount} />
        <Metric label="Unassigned resources" value={operations.unassignedCount} />
        <Metric label="Day-shift projects" value={operations.dayCount} />
        <Metric label="Night-shift projects" value={operations.nightCount} />
      </div>

      <section className="overflow-hidden rounded-none border bg-card">
        <div className="flex flex-col gap-2 border-b px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
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
              <TableHead>Shift / Timing</TableHead>
              <TableHead>Logistics</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {visibleSchedules.length > 0 ? (
              visibleSchedules.map((schedule) => (
                <TableRow key={schedule.projectJobNo}>
                  <TableCell>
                    <div className="font-medium">
                      <Link href={`/daily-schedule?date=${today}`} className="hover:underline">{schedule.project.projectName}</Link>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {schedule.project.customerName} · Job {schedule.projectJobNo} · SO {schedule.project.soNo}
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
                    <p className="text-xs text-muted-foreground">{shiftFromTime(formatTimeValue(schedule.startTime)) ?? "Shift not set"}</p>
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
                <TableCell colSpan={5} className="h-28 text-center">
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

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="border bg-card">
          <h2 className="border-b px-3 py-2 text-sm font-semibold">Resource conflicts / issues</h2>
          {operations.issues.length ? (
            <ul className="divide-y">
              {operations.issues.map((issue, index) => (
                <li key={`${issue.projectJobNo}-${index}`} className="px-3 py-2 text-sm">
                  <Link className="font-medium hover:underline" href={`/daily-schedule?date=${today}`}>Job {issue.projectJobNo}</Link>
                  <p className="text-xs text-muted-foreground">{issue.message}</p>
                </li>
              ))}
            </ul>
          ) : <p className="p-3 text-sm text-muted-foreground">No resource conflicts or incomplete assignments detected.</p>}
        </section>
        <section className="border bg-card">
          <h2 className="border-b px-3 py-2 text-sm font-semibold">Upcoming schedule dates</h2>
          {!upcomingResult.ok ? (
            <p role="alert" className="p-3 text-sm text-destructive">{upcomingResult.error.message}</p>
          ) : upcomingResult.data.length ? (
            <ul className="divide-y">
              {upcomingResult.data.map((item) => {
                const date = formatScheduleDate(item.scheduleDate);
                return <li key={date}><Link className="flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/40" href={`/daily-schedule?date=${date}`}>
                  <span>{new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(item.scheduleDate)}</span>
                  <span className="text-xs text-muted-foreground">{item._count._all} {item._count._all === 1 ? "project" : "projects"}</span>
                </Link></li>;
              })}
            </ul>
          ) : <p className="p-3 text-sm text-muted-foreground">No upcoming schedules.</p>}
        </section>
      </div>
    </div>
  );
}
