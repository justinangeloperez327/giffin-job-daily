import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  ScheduleBoardRow,
  ScheduleResource,
} from "@/features/daily-schedule/daily-schedule-board";
import { shiftScheduleDate } from "@/lib/date-time";
import { cn } from "@/lib/utils";

function dateHref(date: string) {
  return `/daily-schedule?date=${encodeURIComponent(date)}`;
}

export function ReadOnlyScheduleBoard({
  selectedDate,
  today,
  schedules,
  resources,
}: {
  selectedDate: string;
  today: string;
  schedules: ScheduleBoardRow[];
  resources: ScheduleResource[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={dateHref(shiftScheduleDate(selectedDate, -1))}
            className={buttonVariants({ variant: "outline", size: "icon" })}
            aria-label="Previous day"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <form method="get" className="flex items-center gap-2">
            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            />
            <Button type="submit" variant="outline" size="sm">
              Go
            </Button>
          </form>
          <Link
            href={dateHref(shiftScheduleDate(selectedDate, 1))}
            className={buttonVariants({ variant: "outline", size: "icon" })}
            aria-label="Next day"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>

        {selectedDate !== today ? (
          <Link
            href={dateHref(today)}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Today
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground">Today</span>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Project</TableHead>
              <TableHead>Foreman</TableHead>
              <TableHead>Labours</TableHead>
              <TableHead>Timing</TableHead>
              <TableHead>Daily Target</TableHead>
              <TableHead>Logistics</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.length > 0 ? (
              schedules.map((schedule) => {
                const driver = resources.find(
                  (resource) =>
                    resource.employeeId === schedule.driverEmployeeId,
                );
                const timing = [
                  schedule.campStartTime
                    ? `Camp ${schedule.campStartTime}`
                    : null,
                  schedule.startTime || schedule.endTime
                    ? `${schedule.startTime ?? "—"}–${schedule.endTime ?? "—"}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <TableRow key={schedule.projectJobNo}>
                    <TableCell>
                      <Link
                        href={`/projects/${encodeURIComponent(schedule.projectJobNo)}`}
                        className="font-medium hover:underline"
                      >
                        {schedule.projectName}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        Job {schedule.projectJobNo} · SO {schedule.soNo}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{schedule.foremanName}</div>
                      <div className="text-xs text-muted-foreground">
                        {schedule.foremanEmployeeId}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{schedule.labourCount} assigned</div>
                      {schedule.labourNames.length > 0 ? (
                        <div className="max-w-64 truncate text-xs text-muted-foreground">
                          {schedule.labourNames.join(", ")}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>{timing || "—"}</TableCell>
                    <TableCell className="max-w-80 whitespace-pre-wrap">
                      {schedule.dailyTarget || "—"}
                    </TableCell>
                    <TableCell>
                      {driver || schedule.equipmentVehicle ? (
                        <>
                          <div>{driver?.employeeName ?? "No driver"}</div>
                          <div className="text-xs text-muted-foreground">
                            {schedule.equipmentVehicle ?? "No vehicle/equipment"}
                          </div>
                        </>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="h-40 text-center">
                  <p className="text-sm font-medium">No schedule for this day</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    There are no project assignments for the selected date.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Viewer access is read-only.
      </p>
    </div>
  );
}
