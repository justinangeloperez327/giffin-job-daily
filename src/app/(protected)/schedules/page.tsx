import { ArrowRight, CalendarDays, Moon, Sun } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  formatScheduleDate,
  formatTimeValue,
  timeValueToMinutes,
} from "@/lib/date-time";
import { loadRecentSchedules } from "@/server/services/read-models";

export const dynamic = "force-dynamic";

function displayScheduleDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function shiftFromStartTime(value: Date | null) {
  const formatted = formatTimeValue(value);

  if (!formatted) {
    return null;
  }

  const minutes = timeValueToMinutes(formatted);
  return minutes >= 6 * 60 && minutes < 18 * 60 ? "DAY" : "NIGHT";
}

export default async function SchedulesPage() {
  const result = await loadRecentSchedules();

  if (!result.ok) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Schedules"
          description="Browse daily schedules and open a date to manage its projects."
        />
        <div className="border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {result.error.message}
        </div>
      </div>
    );
  }

  const grouped = result.data.reduce(
    (groups, schedule) => {
      const key = formatScheduleDate(schedule.scheduleDate);
      (groups[key] ??= []).push(schedule);
      return groups;
    },
    {} as Record<string, typeof result.data>,
  );

  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Schedules"
        description="Daily schedule list grouped by date."
        actions={
          <Button asChild>
            <Link href="/daily-schedule">
              <CalendarDays className="size-4" />
              Open Daily Planner
            </Link>
          </Button>
        }
      />

      {dates.length === 0 ? (
        <div className="border bg-card px-4 py-12 text-center">
          <CalendarDays className="mx-auto size-6 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No schedules yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create the first daily schedule from the planner.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {dates.map((date) => {
            const schedules = grouped[date];
            const dateValue = schedules[0].scheduleDate;

            return (
              <section key={date} className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <div className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {displayScheduleDate(dateValue)}
                  </div>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="border bg-card">
                  <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">
                        {schedules.length} {schedules.length === 1 ? "Project" : "Projects"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Daily schedule for {displayScheduleDate(dateValue)}
                      </p>
                    </div>

                    <Button asChild variant="outline" size="sm">
                      <Link href={`/daily-schedule?date=${date}`}>
                        Open
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {schedules.map((schedule) => {
                      const shift = shiftFromStartTime(schedule.startTime);

                      return (
                        <Link
                          key={schedule.projectJobNo}
                          href={`/daily-schedule?date=${date}`}
                          className="min-h-28 bg-background p-3 transition-colors hover:bg-muted/40"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                Customer
                              </p>
                              <p className="truncate text-sm font-medium">
                                {schedule.project.projectName}
                              </p>
                            </div>

                            {shift ? (
                              <span className="flex shrink-0 items-center gap-1 border px-1.5 py-0.5 text-[10px] font-medium">
                                {shift === "DAY" ? (
                                  <Sun className="size-3" />
                                ) : (
                                  <Moon className="size-3" />
                                )}
                                {shift === "DAY" ? "Day" : "Night"}
                              </span>
                            ) : (
                              <span className="shrink-0 border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                Shift not set
                              </span>
                            )}
                          </div>

                          <div className="mt-3 space-y-1">
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="text-muted-foreground">Foreman</span>
                              <span className="truncate font-medium">
                                {schedule.foreman.employeeName}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="text-muted-foreground">Job No.</span>
                              <span className="truncate">{schedule.project.jobNo}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="text-muted-foreground">SO No.</span>
                              <span className="truncate">{schedule.project.soNo}</span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
