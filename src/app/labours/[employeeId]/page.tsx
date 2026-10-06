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
import { formatScheduleDate } from "@/lib/date-time";
import { loadLabourDetail } from "@/server/services/read-models";

function displayDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function AssignmentTable({
  rows,
  emptyText,
}: {
  rows: Array<{
    key: string;
    scheduleDate: Date;
    projectJobNo: string;
    projectName: string;
  }>;
  emptyText: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Date</TableHead>
            <TableHead>Job No</TableHead>
            <TableHead>Project</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell className="font-medium">
                  {displayDate(row.scheduleDate)}
                </TableCell>
                <TableCell>{row.projectJobNo}</TableCell>
                <TableCell>{row.projectName}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={3} className="h-28 text-center text-sm text-muted-foreground">
                {emptyText}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default async function LabourDetailPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  const result = await loadLabourDetail({ employeeId });

  if (!result.ok) {
    if (result.error.code === "NOT_FOUND") {
      notFound();
    }

    return (
      <div className="space-y-5">
        <PageHeader title="Employee" />
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {result.error.message}
        </div>
      </div>
    );
  }

  const labour = result.data;
  const totalUsage =
    labour._count.foremanSchedules +
    labour._count.driverSchedules +
    labour._count.scheduleAssignments;

  const foremanRows = labour.foremanSchedules.map((schedule) => ({
    key: `foreman-${formatScheduleDate(schedule.scheduleDate)}-${schedule.projectJobNo}`,
    scheduleDate: schedule.scheduleDate,
    projectJobNo: schedule.projectJobNo,
    projectName: schedule.project.projectName,
  }));

  const driverRows = labour.driverSchedules.map((schedule) => ({
    key: `driver-${formatScheduleDate(schedule.scheduleDate)}-${schedule.projectJobNo}`,
    scheduleDate: schedule.scheduleDate,
    projectJobNo: schedule.projectJobNo,
    projectName: schedule.project.projectName,
  }));

  const labourRows = labour.scheduleAssignments.map((assignment) => ({
    key: `labour-${formatScheduleDate(assignment.scheduleDate)}-${assignment.projectJobNo}`,
    scheduleDate: assignment.scheduleDate,
    projectJobNo: assignment.projectJobNo,
    projectName: assignment.dailySchedule.project.projectName,
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title={labour.employeeName}
        description={`${labour.employeeId} · ${labour.designation}`}
        actions={
          <Link
            href="/labours"
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowLeft className="size-4" />
            Labours
          </Link>
        }
      />

      <div className="grid overflow-hidden rounded-lg border bg-card sm:grid-cols-2 lg:grid-cols-4">
        <div className="border-b px-4 py-3 sm:border-r lg:border-b-0">
          <p className="text-xs text-muted-foreground">Employee ID</p>
          <p className="mt-1 text-sm font-medium">{labour.employeeId}</p>
        </div>
        <div className="border-b px-4 py-3 lg:border-b-0 lg:border-r">
          <p className="text-xs text-muted-foreground">Designation</p>
          <p className="mt-1 text-sm font-medium">{labour.designation}</p>
        </div>
        <div className="border-b px-4 py-3 sm:border-b-0 sm:border-r">
          <p className="text-xs text-muted-foreground">Mobile</p>
          <p className="mt-1 text-sm font-medium">
            {labour.mobileNumber ?? "—"}
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground">Schedule Usage</p>
          <p className="mt-1 text-sm font-medium">{totalUsage}</p>
        </div>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">
            Foreman Assignments ({labour._count.foremanSchedules})
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Recent schedules where this employee was the foreman.
          </p>
        </div>
        <AssignmentTable
          rows={foremanRows}
          emptyText="No foreman assignments."
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">
            Labour Assignments ({labour._count.scheduleAssignments})
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Recent schedules where this employee was assigned as labour.
          </p>
        </div>
        <AssignmentTable
          rows={labourRows}
          emptyText="No labour assignments."
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">
            Driver Assignments ({labour._count.driverSchedules})
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Recent schedules where this employee was the driver.
          </p>
        </div>
        <AssignmentTable
          rows={driverRows}
          emptyText="No driver assignments."
        />
      </section>
    </div>
  );
}
