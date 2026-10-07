import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

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
  formatScheduleDate,
  formatTimeValue,
} from "@/lib/date-time";
import { loadProjectDetail } from "@/server/services/read-models";

function displayDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

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

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ jobNo: string }>;
}) {
  const { jobNo } = await params;
  const result = await loadProjectDetail({ jobNo });

  if (!result.ok) {
    if (result.error.code === "NOT_FOUND") {
      notFound();
    }

    return (
      <div className="space-y-5">
        <PageHeader title="Project" />
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {result.error.message}
        </div>
      </div>
    );
  }

  const project = result.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title={project.projectName}
        description={`Job ${project.jobNo} · SO ${project.soNo}`}
        actions={
          <Link
            href="/projects"
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowLeft className="size-4" />
            Projects
          </Link>
        }
      />

      <div className="grid overflow-hidden rounded-lg border bg-card sm:grid-cols-3">
        <div className="border-b px-4 py-3 sm:border-b-0 sm:border-r">
          <p className="text-xs text-muted-foreground">Job No</p>
          <p className="mt-1 text-sm font-medium">{project.jobNo}</p>
        </div>
        <div className="border-b px-4 py-3 sm:border-b-0 sm:border-r">
          <p className="text-xs text-muted-foreground">SO No</p>
          <p className="mt-1 text-sm font-medium">{project.soNo}</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground">Daily Schedules</p>
          <p className="mt-1 text-sm font-medium">
            {project._count.dailySchedules}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Schedule History</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Recent daily schedules associated with this project.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Foreman</TableHead>
                <TableHead className="text-right">Labours</TableHead>
                <TableHead>Timing</TableHead>
                <TableHead>Driver</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {project.dailySchedules.length > 0 ? (
                project.dailySchedules.map((schedule) => (
                  <TableRow
                    key={`${formatScheduleDate(schedule.scheduleDate)}-${schedule.projectJobNo}`}
                  >
                    <TableCell className="font-medium">
                      {displayDate(schedule.scheduleDate)}
                    </TableCell>
                    <TableCell>
                      <div>{schedule.foreman.employeeName}</div>
                      <div className="text-xs text-muted-foreground">
                        {schedule.foreman.employeeId}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {schedule._count.labours}
                    </TableCell>
                    <TableCell>
                      {displayTiming(
                        schedule.campStartTime,
                        schedule.startTime,
                        schedule.endTime,
                      )}
                    </TableCell>
                    <TableCell>
                      {schedule.driver ? (
                        <>
                          <div>{schedule.driver.employeeName}</div>
                          <div className="text-xs text-muted-foreground">
                            {schedule.driver.employeeId}
                          </div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="h-32 text-center">
                    <p className="text-sm font-medium">No schedules yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Daily schedules for this project will appear here.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {project._count.dailySchedules > project.dailySchedules.length ? (
            <div className="border-t px-3 py-2 text-xs text-muted-foreground">
              Showing the latest {project.dailySchedules.length} of{" "}
              {project._count.dailySchedules} schedules.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
