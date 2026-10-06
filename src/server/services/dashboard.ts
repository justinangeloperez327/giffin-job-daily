import {
  actionFailure,
  actionSuccess,
  validationFailure,
} from "@/lib/action-result";
import { scheduleDayQuerySchema } from "@/lib/validation/query";
import { mapDatabaseError } from "@/server/database/errors";
import {
  countLabours,
  countProjects,
  listDailySchedulesByDate,
} from "@/server/repositories";

export async function loadDashboardSummary(input: unknown) {
  const parsed = scheduleDayQuerySchema.safeParse(input);

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  try {
    const [totalProjects, totalEmployees, schedules] = await Promise.all([
      countProjects(),
      countLabours(),
      listDailySchedulesByDate(parsed.data.scheduleDate),
    ]);

    const assignedEmployees = new Set<string>();
    let labourCount = 0;
    let driverCount = 0;

    for (const schedule of schedules) {
      assignedEmployees.add(schedule.foremanEmployeeId);

      if (schedule.driverEmployeeId) {
        assignedEmployees.add(schedule.driverEmployeeId);
        driverCount += 1;
      }

      labourCount += schedule.labours.length;

      for (const assignment of schedule.labours) {
        assignedEmployees.add(assignment.employeeId);
      }
    }

    return actionSuccess({
      totalProjects,
      totalEmployees,
      today: {
        scheduleDate: parsed.data.scheduleDate,
        projectCount: schedules.length,
        foremanCount: schedules.length,
        labourCount,
        driverCount,
        assignedEmployeeCount: assignedEmployees.size,
      },
      schedules,
    });
  } catch (error) {
    return actionFailure(mapDatabaseError(error));
  }
}
