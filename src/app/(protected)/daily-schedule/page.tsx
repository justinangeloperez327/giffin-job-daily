import { PageHeader } from "@/components/layout/page-header";
import {
  DailyScheduleBoard,
  type ScheduleBoardRow,
  type ScheduleResource,
} from "@/features/daily-schedule/daily-schedule-board";
import type { ScheduleProjectOption } from "@/features/daily-schedule/project-selector";
import { ReadOnlyScheduleBoard } from "@/features/daily-schedule/read-only-schedule-board";
import {
  formatTimeValue,
  getScheduleDateInTimeZone,
} from "@/lib/date-time";
import { scheduleDateSchema } from "@/lib/validation/common";
import { requirePageUser } from "@/server/auth/session";
import {
  loadProjectOptions,
  loadResourcePool,
  loadScheduleDay,
} from "@/server/services/read-models";

type SearchParams = Record<string, string | string[] | undefined>;

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export const dynamic = "force-dynamic";

export default async function DailySchedulePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requirePageUser();
  const timeZone = process.env.APP_TIME_ZONE ?? "Asia/Dubai";
  const today = getScheduleDateInTimeZone(new Date(), timeZone);
  const rawSearchParams = await searchParams;
  const requestedDate = firstQueryValue(rawSearchParams.date);
  const parsedDate = scheduleDateSchema.safeParse(requestedDate);
  const selectedDate = parsedDate.success ? parsedDate.data : today;

  const [scheduleResult, resourceResult, projectResult] = await Promise.all([
    loadScheduleDay({ scheduleDate: selectedDate }),
    loadResourcePool({ scheduleDate: selectedDate }),
    loadProjectOptions(),
  ]);

  if (!scheduleResult.ok) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Daily Schedule"
          description="Plan daily project resources, timing, targets, and logistics."
        />
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {scheduleResult.error.message}
        </div>
      </div>
    );
  }

  const schedules: ScheduleBoardRow[] = scheduleResult.data.map((schedule) => ({
    projectJobNo: schedule.projectJobNo,
    projectName: schedule.project.projectName,
    soNo: schedule.project.soNo,
    foremanEmployeeId: schedule.foreman.employeeId,
    foremanName: schedule.foreman.employeeName,
    labourCount: schedule.labours.length,
    labourNames: schedule.labours
      .slice(0, 4)
      .map((assignment) => assignment.labour.employeeName),
    labourEmployeeIds: schedule.labours.map(
      (assignment) => assignment.labour.employeeId,
    ),
    campStartTime: formatTimeValue(schedule.campStartTime),
    startTime: formatTimeValue(schedule.startTime),
    endTime: formatTimeValue(schedule.endTime),
    dailyTarget: schedule.dailyTarget,
    driverEmployeeId: schedule.driver?.employeeId ?? null,
    equipmentVehicle: schedule.equipmentVehicle,
  }));

  const projects: ScheduleProjectOption[] = projectResult.ok
    ? projectResult.data
    : [];

  const resources: ScheduleResource[] = resourceResult.ok
    ? resourceResult.data
    : [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Daily Schedule"
        description="Plan daily project resources, timing, targets, and logistics."
      />

      {user.role === "VIEWER" ? (
        <ReadOnlyScheduleBoard
          selectedDate={selectedDate}
          today={today}
          schedules={schedules}
          resources={resources}
        />
      ) : (
        <DailyScheduleBoard
          selectedDate={selectedDate}
          today={today}
          initialSchedules={schedules}
          projects={projects}
          projectError={projectResult.ok ? undefined : projectResult.error.message}
          resources={resources}
          resourceError={resourceResult.ok ? undefined : resourceResult.error.message}
        />
      )}
    </div>
  );
}
