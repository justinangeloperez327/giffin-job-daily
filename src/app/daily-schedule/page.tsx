import { PageHeader } from "@/components/layout/page-header";
import {
  DailyScheduleBoard,
  type ResourcePoolSummary,
  type ScheduleBoardRow,
} from "@/features/daily-schedule/daily-schedule-board";
import type { ScheduleProjectOption } from "@/features/daily-schedule/project-selector";
import {
  formatTimeValue,
  getScheduleDateInTimeZone,
} from "@/lib/date-time";
import { scheduleDateSchema } from "@/lib/validation/common";
import {
  loadProjectOptions,
  loadResourcePool,
  loadScheduleDay,
} from "@/server/services/read-models";

type SearchParams = Record<string, string | string[] | undefined>;

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DailySchedulePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
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
    campStartTime: formatTimeValue(schedule.campStartTime),
    startTime: formatTimeValue(schedule.startTime),
    endTime: formatTimeValue(schedule.endTime),
    dailyTarget: schedule.dailyTarget,
  }));

  const resourceSummary: ResourcePoolSummary = resourceResult.ok
    ? {
        total: resourceResult.data.length,
        available: resourceResult.data.filter((resource) => resource.available)
          .length,
        assigned: resourceResult.data.filter((resource) => !resource.available)
          .length,
      }
    : {
        total: 0,
        available: 0,
        assigned: 0,
      };

  const projects: ScheduleProjectOption[] = projectResult.ok
    ? projectResult.data
    : [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Daily Schedule"
        description="Plan daily project resources, timing, targets, and logistics."
      />

      <DailyScheduleBoard
        selectedDate={selectedDate}
        today={today}
        initialSchedules={schedules}
        projects={projects}
        projectError={projectResult.ok ? undefined : projectResult.error.message}
        resourceSummary={resourceSummary}
        resourceError={resourceResult.ok ? undefined : resourceResult.error.message}
      />
    </div>
  );
}
